function Database(db) {
    this.db = db;
};

Database.prototype.insert = function(table, item) {
    return this.db.collection(table).insertOne(item);
};

Database.prototype.insertMany = function(table,items) {

	return this.db.collection(table).insertMany(items);
};

// Database.prototype.find = function(table, filter) {
//     return this.db.collection(table).findOne(filter);
// };

Database.prototype.findwithfield = function(table, filter,field) {
    var cursor = this.db.collection(table).find(filter).project(field);
    return cursor.toArray();
};

Database.prototype.delete = function(table, filter) {
    return this.db.collection(table).findOneAndDelete(filter);
};

Database.prototype.deleteAll = function(table, filter) {
    return this.db.collection(table).deleteMany(filter);
};

Database.prototype.update = function(table, filter, change) {
    return this.db.collection(table).findOneAndUpdate(filter,{$set: change});
};


module.exports = Database;
