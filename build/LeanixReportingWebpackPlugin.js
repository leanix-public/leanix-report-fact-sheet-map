const fs = require('fs')
const tar = require('tar')
const path = require('path')
const request = require('sync-request')
const {FormData} = require('sync-request')
const rp = require('request-promise-native')
const chalk = require('chalk')
const jwtDecode = require('jwt-decode')
const opn = require('opn')

class LeanixReportingWebpackPlugin {
  constructor(port = 8080) {
    this.port = port
    if (fs.existsSync(path.resolve(process.cwd(), 'lxr.json'))) {
    } else {
      const errorMsg = `Could not find lxr.json`
      console.error(chalk.redBright(errorMsg))
      throw errorMsg
    }
    this.lxrConfig = require(path.resolve(process.cwd(), 'lxr.json'))
    this.validateLxrConfig()
    this.bearerToken = this.getAccessToken(this.lxrConfig.host, this.lxrConfig.apitoken)
    this._launchUrl = this.getLaunchUrl(this.lxrConfig.host, this.bearerToken)
  }

  get launchUrl () {
    return this._launchUrl
  }

  writeMetadataFile () {
    return new Promise((resolve, reject) => {
      const packageJson = require(path.resolve(process.cwd(), 'package.json'))
      const metadataFile = path.resolve(process.cwd(), 'dist/lxreport.json')
      const metadata = Object.assign({}, {
        name: packageJson.name,
        version: packageJson.version,
        author: packageJson.author,
        description: packageJson.description,
        documentationLink: packageJson.documentationLink
      }, packageJson.leanixReport)
      fs.writeFileSync(metadataFile, JSON.stringify(metadata))
      resolve()
    })
  }

  createTarFromSrcFolderAndAddToDist () {
    const files = fs.readdirSync(path.resolve(process.cwd(), 'src'))
    return tar.c({ gzip: true, cwd: 'src', file: 'dist/src.tgz' }, files)
  }

  createTarFromDistFolder () {
    const files = fs.readdirSync(path.resolve(process.cwd(), 'dist'))
    return tar.c({ gzip: true, cwd: 'dist', file: 'bundle.tgz' }, files)
  }

  executeUpload () {
    this.writeMetadataFile()
      .then(() => this.createTarFromSrcFolderAndAddToDist())
      .then(() => this.createTarFromDistFolder())
      .then(() => {
        const options = {
          method: 'POST',
          url: `https://${this.lxrConfig.host}/services/pathfinder/v1/reports/upload`,
          headers: {
            'Authorization': 'Bearer ' + this.bearerToken
          },
          formData: {
            file: fs.createReadStream(path.resolve(process.cwd(), 'bundle.tgz'))
          }
        }
        return rp(options)
      })
      .then(body => {
        const bodyJson = JSON.parse(body)
        if (bodyJson.status === 'OK') {
          console.log(chalk.green('\u2713 Project successfully uploaded!'))
          return true
        } else if (bodyJson.status === 'ERROR') {
          console.log(chalk.red('ERROR: ' + responseJson.errorMessage));
          return false
        }
      })
      .catch(err => {
        const responseBody = err.response.toJSON().body
        const errorJson = JSON.parse(responseBody)
        if (errorJson.errorMessage) {
          console.log(chalk.red('ERROR: ' + errorJson.errorMessage))
        } else {
          console.log(chalk.red('ERROR: ' + responseBody))
        }
        return false
      })
  }

  validateLxrConfig (lxrConfig = this.lxrConfig) {
    if (!lxrConfig) lxrConfig = this.lxrConfig
    const validationErrors = []
    if (!lxrConfig.host) validationErrors.push('host not defined')
    if (!lxrConfig.apitoken) validationErrors.push('apitoken not defined')
    if (validationErrors.length != 0) {
      console.error(chalk.red('Errors were found while validating lxr.json file'))
      validationErrors.forEach(err => console.error(chalk.red(`lxr.json -> ${err}`)))
      throw 'Errors found while validating lxr.json file!'
    }
  }

  getAccessToken (host, apiToken) {
    const options = {
      headers: {
        'Authorization': 'Basic ' + Buffer.from('apitoken:' + apiToken).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
    }
    const res = request('POST', `https://${host}/services/mtm/v1/oauth2/token?grant_type=client_credentials`, options)
    if (res.statusCode != 200) {
      const errorMsg = `${res.statusCode} while getting the LeanIX API token`
      console.error(chalk.redBright(errorMsg))
      throw errorMsg
    }
    let body = JSON.parse(res.getBody())
    if (!body.access_token) {
      const errorMsg = `could not find access_token in response: ${res.getBody()}`
      console.error(chalk.redBright(errorMsg))
      throw errorMsg
    }
    return body.access_token
  }

  getLaunchUrl (leanixInstance, bearerToken) {
    if (!leanixInstance || typeof leanixInstance !== 'string') {
      const errorMsg = 'no leanix instance was provided!'
      console.error(chalk.redBright(errorMsg))
      throw errorMsg
    }
    if (!bearerToken || typeof bearerToken !== 'string') {
      const errorMsg = 'no valid Bearer Token was provided!'
      console.error(chalk.redBright(errorMsg))
      throw errorMsg
    }

    const decodedToken = jwtDecode(bearerToken)
    let workspaceName = ''
    if (decodedToken && decodedToken.principal && decodedToken.principal.permission && decodedToken.principal.permission.workspaceName) {
      workspaceName = decodedToken.principal.permission.workspaceName
      console.log(chalk.cyanBright(`\nYour workspace is ${workspaceName}`))
    } else {
      const errorMsg = `could not retrieve workspace name from bearer token!`
      console.error(chalk.redBright(errorMsg))
      throw errorMsg
    }

    const port = this.port || 8080
    const localhostUrl = `https://localhost:${port}`
    const urlEncoded = encodeURIComponent(localhostUrl)
    const host = 'https://' + leanixInstance
    const bearerTokenHash = bearerToken ? `#access_token=${bearerToken}` : ''
    const baseLaunchUrl = `${host}/${workspaceName}/reporting/dev?url=${urlEncoded}`
    const launchUrl = baseLaunchUrl + bearerTokenHash
    return launchUrl
  }

  apply(compiler) {
    let isBrowserOpened = false

    compiler.plugin('compile', function(params) {
      // console.log('The compiler is starting to compile...')
    })
  
    compiler.plugin('compilation', compilation => {
      // console.log('The compiler is starting a new compilation...')
  
      compilation.plugin('optimize', () => {
        // console.log('The compilation is starting to optimize files...')
      })
    })
  
    compiler.plugin('emit', (compilation, callback) => {
      if (isBrowserOpened == false && process.env.NODE_ENV != 'production') {
        opn(this.launchUrl)
        isBrowserOpened = true
      }
      callback()
    })

    compiler.plugin('done', (compilation) => {
      if (process.env.NODE_ENV === 'production' && process.env.UPLOAD_TO_LEANIX) {
        this.executeUpload ()
      }
    })
  }
}

module.exports = LeanixReportingWebpackPlugin