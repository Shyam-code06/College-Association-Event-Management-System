const db = require('../config/database');

const collegeModel = {
  findAllActive: async (trx = db) => {
    return trx('colleges')
      .select('id', 'name', 'code')
      .where('is_active', true)
      .whereNull('deleted_at')
      .orderBy('name', 'asc');
  },

  findById: async (id, trx = db) => {
    return trx('colleges')
      .where({ id })
      .first();
  },

  findByNameOrCode: async (name, code, trx = db) => {
    return trx('colleges')
      .where('name', name)
      .orWhere('code', code)
      .first();
  },

  create: async (data, trx = db) => {
    const [id] = await trx('colleges').insert(data);
    return trx('colleges').where({ id }).first();
  },

  update: async (id, data, trx = db) => {
    await trx('colleges').where({ id }).update(data);
    return trx('colleges').where({ id }).first();
  },

  softDelete: async (id, trx = db) => {
    await trx('colleges').where({ id }).update({
      is_active: false,
      deleted_at: trx.fn.now()
    });
    return trx('colleges').where({ id }).first();
  }
};

module.exports = collegeModel;
