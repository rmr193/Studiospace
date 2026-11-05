import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ObjectId } from "mongodb";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BUNDLED_DATA_DIR = path.resolve(__dirname, "../../data");
const BUNDLED_DB_FILE = path.join(BUNDLED_DATA_DIR, "studiospace-db.json");
const DATA_DIR = process.env.VERCEL ? "/tmp" : BUNDLED_DATA_DIR;
const DB_FILE = process.env.VERCEL ? "/tmp/studiospace-db.json" : BUNDLED_DB_FILE;

function normalizeId(val) {
  if (val instanceof ObjectId) return val.toHexString();
  if (val && typeof val === "object" && val.$oid) return String(val.$oid);
  return val;
}

function serializeForDisk(obj) {
  return JSON.stringify(
    obj,
    (key, value) => {
      if (value instanceof ObjectId) {
        return { $oid: value.toHexString() };
      }
      return value;
    },
    2
  );
}

function deserializeFromDisk(raw) {
  return JSON.parse(raw, (key, value) => {
    if (value && typeof value === "object" && typeof value.$oid === "string" && Object.keys(value).length === 1) {
      try {
        return new ObjectId(value.$oid);
      } catch {
        return value.$oid;
      }
    }
    if ((key === "createdAt" || key === "updatedAt" || key === "expiresAt") && typeof value === "string") {
      const d = new Date(value);
      if (!Number.isNaN(d.getTime())) return d;
    }
    return value;
  });
}

function valuesEqual(a, b) {
  if (a instanceof ObjectId || b instanceof ObjectId) {
    return String(normalizeId(a)) === String(normalizeId(b));
  }
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  if (a instanceof Date && typeof b === "string") {
    return a.getTime() === new Date(b).getTime();
  }
  if (typeof a === "string" && b instanceof Date) {
    return new Date(a).getTime() === b.getTime();
  }
  return a === b;
}

function matchesCondition(docVal, cond) {
  if (cond === null || cond === undefined || typeof cond !== "object" || cond instanceof ObjectId || cond instanceof Date || cond instanceof RegExp) {
    if (cond instanceof RegExp) {
      return cond.test(String(docVal ?? ""));
    }
    if (Array.isArray(docVal) && !Array.isArray(cond)) {
      return docVal.some((item) => valuesEqual(item, cond));
    }
    return valuesEqual(docVal, cond);
  }

  for (const [op, target] of Object.entries(cond)) {
    switch (op) {
      case "$eq":
        if (!valuesEqual(docVal, target)) return false;
        break;
      case "$ne":
        if (valuesEqual(docVal, target)) return false;
        break;
      case "$gt":
        if (!(docVal > target)) return false;
        break;
      case "$gte":
        if (!(docVal >= target)) return false;
        break;
      case "$lt":
        if (!(docVal < target)) return false;
        break;
      case "$lte":
        if (!(docVal <= target)) return false;
        break;
      case "$in":
        if (!Array.isArray(target)) return false;
        if (Array.isArray(docVal)) {
          if (!docVal.some((d) => target.some((t) => valuesEqual(d, t)))) return false;
        } else {
          if (!target.some((t) => valuesEqual(docVal, t))) return false;
        }
        break;
      case "$nin":
        if (!Array.isArray(target)) return false;
        if (Array.isArray(docVal)) {
          if (docVal.some((d) => target.some((t) => valuesEqual(d, t)))) return false;
        } else {
          if (target.some((t) => valuesEqual(docVal, t))) return false;
        }
        break;
      case "$regex": {
        const flags = cond.$options || "";
        const regex = target instanceof RegExp ? target : new RegExp(target, flags);
        if (!regex.test(String(docVal ?? ""))) return false;
        break;
      }
      case "$options":
        break;
      case "$not":
        if (matchesCondition(docVal, target)) return false;
        break;
      default:
        break;
    }
  }
  return true;
}

export function matchesFilter(doc, filter = {}) {
  if (!filter || Object.keys(filter).length === 0) return true;

  for (const [key, cond] of Object.entries(filter)) {
    if (key === "$and") {
      if (!Array.isArray(cond) || !cond.every((sub) => matchesFilter(doc, sub))) return false;
      continue;
    }
    if (key === "$or") {
      if (!Array.isArray(cond) || !cond.some((sub) => matchesFilter(doc, sub))) return false;
      continue;
    }
    if (key === "$nor") {
      if (!Array.isArray(cond) || cond.some((sub) => matchesFilter(doc, sub))) return false;
      continue;
    }
    if (key === "$expr") {
      if (cond.$eq && Array.isArray(cond.$eq)) {
        const [left, right] = cond.$eq;
        if (left !== right) return false;
      }
      continue;
    }
    const docVal = doc[key];
    if (!matchesCondition(docVal, cond)) return false;
  }
  return true;
}

function applyUpdate(doc, update) {
  const updated = { ...doc };
  const hasOperators = Object.keys(update).some((k) => k.startsWith("$"));

  if (!hasOperators) {
    return { ...updated, ...update, _id: doc._id };
  }

  if (update.$set) {
    for (const [k, v] of Object.entries(update.$set)) {
      if (k !== "_id") updated[k] = v;
    }
  }
  if (update.$inc) {
    for (const [k, v] of Object.entries(update.$inc)) {
      updated[k] = (Number(updated[k]) || 0) + Number(v);
    }
  }
  if (update.$addToSet) {
    for (const [k, v] of Object.entries(update.$addToSet)) {
      const arr = Array.isArray(updated[k]) ? [...updated[k]] : [];
      if (!arr.some((item) => valuesEqual(item, v))) {
        arr.push(v);
      }
      updated[k] = arr;
    }
  }
  if (update.$pull) {
    for (const [k, v] of Object.entries(update.$pull)) {
      const arr = Array.isArray(updated[k]) ? [...updated[k]] : [];
      updated[k] = arr.filter((item) => !valuesEqual(item, v));
    }
  }
  return updated;
}

class LocalCursor {
  constructor(docs) {
    this.docs = [...docs];
  }

  sort(sortSpec = {}) {
    const entries = Object.entries(sortSpec);
    if (entries.length > 0) {
      this.docs.sort((a, b) => {
        for (const [field, dir] of entries) {
          const av = a[field];
          const bv = b[field];
          const aComp = av instanceof Date ? av.getTime() : av;
          const bComp = bv instanceof Date ? bv.getTime() : bv;
          if (aComp < bComp) return dir === -1 ? 1 : -1;
          if (aComp > bComp) return dir === -1 ? -1 : 1;
        }
        return 0;
      });
    }
    return this;
  }

  skip(n) {
    this.docs = this.docs.slice(n);
    return this;
  }

  limit(n) {
    this.docs = this.docs.slice(0, n);
    return this;
  }

  async toArray() {
    return this.docs.map((d) => ({ ...d }));
  }
}

class LocalCollection {
  constructor(db, name) {
    this.db = db;
    this.name = name;
  }

  _getDocs() {
    this.db._loadFromDisk();
    if (!this.db.collections[this.name]) {
      this.db.collections[this.name] = [];
    }
    return this.db.collections[this.name];
  }

  _save() {
    this.db._saveToDisk();
  }

  async createIndex() {
    return "ok";
  }

  find(filter = {}) {
    const matched = this._getDocs().filter((d) => matchesFilter(d, filter));
    return new LocalCursor(matched);
  }

  async findOne(filter = {}) {
    const found = this._getDocs().find((d) => matchesFilter(d, filter));
    return found ? { ...found } : null;
  }

  async countDocuments(filter = {}) {
    return this._getDocs().filter((d) => matchesFilter(d, filter)).length;
  }

  async insertOne(doc) {
    const docs = this._getDocs();
    const _id = doc._id instanceof ObjectId ? doc._id : doc._id ? new ObjectId(String(doc._id)) : new ObjectId();
    const newDoc = { ...doc, _id };
    docs.push(newDoc);
    this._save();
    return { acknowledged: true, insertedId: _id };
  }

  async insertMany(newDocs = []) {
    const docs = this._getDocs();
    const insertedIds = {};
    newDocs.forEach((doc, idx) => {
      const _id = doc._id instanceof ObjectId ? doc._id : doc._id ? new ObjectId(String(doc._id)) : new ObjectId();
      docs.push({ ...doc, _id });
      insertedIds[idx] = _id;
    });
    this._save();
    return { acknowledged: true, insertedCount: newDocs.length, insertedIds };
  }

  async updateOne(filter, update, options = {}) {
    const docs = this._getDocs();
    const idx = docs.findIndex((d) => matchesFilter(d, filter));
    if (idx === -1) {
      if (options.upsert) {
        const _id = new ObjectId();
        const base = { _id };
        const upserted = applyUpdate(base, update);
        docs.push(upserted);
        this._save();
        return { acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedId: _id };
      }
      return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
    }
    docs[idx] = applyUpdate(docs[idx], update);
    this._save();
    return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
  }

  async updateMany(filter, update) {
    const docs = this._getDocs();
    let modifiedCount = 0;
    for (let i = 0; i < docs.length; i++) {
      if (matchesFilter(docs[i], filter)) {
        docs[i] = applyUpdate(docs[i], update);
        modifiedCount++;
      }
    }
    if (modifiedCount > 0) this._save();
    return { acknowledged: true, matchedCount: modifiedCount, modifiedCount };
  }

  async findOneAndUpdate(filter, update, options = {}) {
    const docs = this._getDocs();
    const idx = docs.findIndex((d) => matchesFilter(d, filter));
    if (idx === -1) {
      return options.includeResultMetadata ? { value: null } : null;
    }
    const before = { ...docs[idx] };
    const after = applyUpdate(docs[idx], update);
    docs[idx] = after;
    this._save();
    const resultDoc = options.returnDocument === "before" ? before : { ...after };
    return options.includeResultMetadata ? { value: resultDoc } : resultDoc;
  }

  async findOneAndDelete(filter, options = {}) {
    const docs = this._getDocs();
    const idx = docs.findIndex((d) => matchesFilter(d, filter));
    if (idx === -1) {
      return options.includeResultMetadata ? { value: null } : null;
    }
    const [removed] = docs.splice(idx, 1);
    this._save();
    return options.includeResultMetadata ? { value: removed } : removed;
  }

  async deleteOne(filter) {
    const docs = this._getDocs();
    const idx = docs.findIndex((d) => matchesFilter(d, filter));
    if (idx === -1) return { acknowledged: true, deletedCount: 0 };
    docs.splice(idx, 1);
    this._save();
    return { acknowledged: true, deletedCount: 1 };
  }

  async deleteMany(filter = {}) {
    const docs = this._getDocs();
    const initialLen = docs.length;
    this.db.collections[this.name] = docs.filter((d) => !matchesFilter(d, filter));
    const deletedCount = initialLen - this.db.collections[this.name].length;
    if (deletedCount > 0) this._save();
    return { acknowledged: true, deletedCount };
  }

  aggregate(pipeline = []) {
    let results = this._getDocs().map((d) => ({ ...d }));

    for (const stage of pipeline) {
      if (stage.$match) {
        results = results.filter((d) => matchesFilter(d, stage.$match));
      } else if (stage.$lookup) {
        const { from, localField, foreignField, as } = stage.$lookup;
        const foreignDocs = this.db.collection(from)._getDocs();
        results = results.map((doc) => {
          const localVal = localField ? doc[localField] : undefined;
          const matches = foreignDocs.filter((fd) =>
            foreignField ? valuesEqual(fd[foreignField], localVal) : false
          );
          return { ...doc, [as]: matches.map((m) => ({ ...m })) };
        });
      } else if (stage.$unwind) {
        const pathSpec = typeof stage.$unwind === "string" ? stage.$unwind : stage.$unwind.path;
        const preserve = typeof stage.$unwind === "object" && stage.$unwind.preserveNullAndEmptyArrays;
        const field = pathSpec.replace(/^\$/, "");
        const unwound = [];
        for (const doc of results) {
          const arr = doc[field];
          if (Array.isArray(arr) && arr.length > 0) {
            for (const item of arr) {
              unwound.push({ ...doc, [field]: item });
            }
          } else if (preserve) {
            unwound.push({ ...doc, [field]: null });
          }
        }
        results = unwound;
      } else if (stage.$sort) {
        const cursor = new LocalCursor(results).sort(stage.$sort);
        results = cursor.docs;
      } else if (stage.$skip) {
        results = results.slice(stage.$skip);
      } else if (stage.$limit) {
        results = results.slice(0, stage.$limit);
      } else if (stage.$project) {
        results = results.map((doc) => {
          const projected = { _id: doc._id };
          for (const [k, include] of Object.entries(stage.$project)) {
            if (include && doc[k] !== undefined) projected[k] = doc[k];
          }
          return projected;
        });
      } else if (stage.$count) {
        results = [{ [stage.$count]: results.length }];
      }
    }

    return new LocalCursor(results);
  }
}

export class LocalMongoDb {
  constructor() {
    this.collections = {};
    this._loadFromDisk();
  }

  _loadFromDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const sourceFile = fs.existsSync(DB_FILE)
        ? DB_FILE
        : fs.existsSync(BUNDLED_DB_FILE)
        ? BUNDLED_DB_FILE
        : null;
      if (sourceFile) {
        const raw = fs.readFileSync(sourceFile, "utf-8");
        if (raw.trim()) {
          this.collections = deserializeFromDisk(raw);
        }
      }
    } catch (err) {
      console.error("Warning loading local DB file:", err.message);
    }
  }

  _saveToDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, serializeForDisk(this.collections), "utf-8");
    } catch (err) {
      console.error("Warning saving local DB file:", err.message);
    }
  }

  collection(name) {
    return new LocalCollection(this, name);
  }
}

