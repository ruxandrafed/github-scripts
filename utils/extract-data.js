const json2csv = require('json2csv').parse

const extractDataForCsv = (args) => {
  let data, options
  data = args.data || null
  options = args.options  || null

  if (data == null || !data.length) {
    return null
  }
  return json2csv(data, options)
}

const extractReposInfo = (githubData) => {
  return githubData.map(repo => {
    return {
      owner: repo.owner.login,
      name: repo.name
    }
  })
}

module.exports = {
  extractDataForCsv,
  extractReposInfo
}