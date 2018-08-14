const Sequelize = require('sequelize')
const SQL = new Sequelize('sqlite:./database.sqlite')

const users = SQL.define('users', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true
  },
  online: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  cases: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  lastCase: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  }
})

SQL.sync()
  .then(() => console.log('sync users'))
  .catch(error => console.error(error))

module.exports = users
