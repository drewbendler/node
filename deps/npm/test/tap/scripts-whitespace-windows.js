var fs = require('graceful-fs')
var path = require('path')

var mkdirp = require('mkdirp')
var test = require('tap').test

var common = require('../common-tap')

var pkg = common.pkg
var tmp = path.resolve(pkg, 'tmp')
var cache = common.cache
var dep = path.resolve(pkg, 'dep')

var EXEC_OPTS = { cwd: pkg }

var json = {
  name: 'scripts-whitespace-windows',
  version: '1.0.0',
  description: 'a test',
  repository: 'git://github.com/robertkowalski/bogus',
  scripts: {
    foo: 'foo --title "Analysis of" --recurse -d report src'
  },
  dependencies: {
    'scripts-whitespace-windows-dep': '0.0.1'
  },
  license: 'WTFPL'
}

var dependency = {
  name: 'scripts-whitespace-windows-dep',
  version: '0.0.1',
  bin: [ 'bin/foo' ]
}

var foo = function () { /*
#!/usr/bin/env node

if (process.argv.length === 8)
  console.log('npm-test-fine')
*/ }.toString().split('\n').slice(1, -1).join('\n')

test('setup', function (t) {
  mkdirp.sync(tmp)
  fs.writeFileSync(
    path.join(pkg, 'package.json'),
    JSON.stringify(json, null, 2)
  )
  fs.writeFileSync(
    path.join(pkg, 'README.md'),
    "### THAT'S RIGHT\n"
  )

  mkdirp.sync(path.join(dep, 'bin'))
  fs.writeFileSync(
    path.join(dep, 'package.json'),
    JSON.stringify(dependency, null, 2)
  )
  fs.writeFileSync(path.join(dep, 'bin', 'foo'), foo)

  common.npm(['i', dep], {
    cwd: pkg,
    env: Object.assign({
      npm_config_cache: cache,
      npm_config_tmp: tmp,
      npm_config_prefix: pkg,
      npm_config_global: 'false'
    }, process.env)
  }, function (err, code, stdout, stderr) {
    t.ifErr(err, 'npm i ' + dep + ' finished without error')
    t.equal(code, 0, 'npm i ' + dep + ' exited ok')
    t.notOk(stderr, 'no output stderr')
    t.end()
  })
})

test('test', function (t) {
  common.npm(['run', 'foo'], EXEC_OPTS, function (err, code, stdout, stderr) {
    stderr = stderr.trim()
    if (stderr) console.error(stderr)
    t.ifErr(err, 'npm run finished without error')
    t.equal(code, 0, 'npm run exited ok')
    t.notOk(stderr, 'no output stderr: ' + stderr)
    stdout = stdout.trim()
    t.ok(/npm-test-fine/.test(stdout))
    t.end()
  })
})
