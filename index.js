#!/usr/bin/env node

const path = require('path')
const fs = require('fs')
const child_process = require('child_process');
const readLine = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
})

//执行基本方法
const writeTask = (str) => {
    readLine.write('\x1B[33m' + str + ' .... \x1B[39m')
}
const writeSuccess = (str) => {
    readLine.write('\x1B[36m ' + str + '\x1B[39m')
}
const question = ask => new Promise(resolve => readLine.question(ask, resolve));
const spawn = (cmd, pram) => new Promise((resolve, reject) => {
    let msgs = Buffer.alloc(0)
    child_process.spawn(cmd, pram)
        .on('exit', () => {
            resolve(msgs)
        })
        .on('error', (err) => {
            err.message = msgs.toString() + '\n' + err.message
            reject(err)
        })
        .stdout.on('data', (data) => {
            msgs = Buffer.concat([msgs, data])
        })
});
// 
(async () => {
    let templateName = (await question(`请输入应用类型[ default | plugin ]: (default)  `)).trim() || 'default'
    if (!['default', 'plugin'].includes(templateName)) {
        console.error('您指定的应用类型不存在')
        process.exit()
    }

    const orgArrays = ['', '@pch18/', '@pch18run/']
    let orgName = (await question(`请输入组织名称[ ${orgArrays.map((t, i) => `${i}=>${t}`).join(' | ')} ]: (0)  `)).trim() || 0
    if (/^@/.test(orgName)) {
    } else if (typeof orgArrays[orgName] === 'string') {
        orgName = orgArrays[orgName]
    } else {
        console.error('输入错误, 自定义组织名称请@开头')
        process.exit()
    }

    const packageDir = process.cwd()
    let packageName = orgName + path.basename(packageDir).replace(/:/g, '/')
    const templateDir = __dirname + '/template_' + templateName
    const packageJSON = require(templateDir + '/package.json')

    packageName = (await question(`请输入Package名称: (${packageName})  `)).trim() || packageName
    if (!new RegExp("^(?:@[a-z0-9-~][a-z0-9-._~]*/)?[a-z0-9-~][a-z0-9-._~]*$").test(packageName)) {
        console.error('文件名不符合规范, 操作中断')
        process.exit()
    }

    writeTask('生成基本文件')
    await spawn('cp', ['-Ran', templateDir + '/', packageDir])
    writeSuccess('完成\n')

    writeTask('修改配置信息')
    packageJSON.name = packageName
    fs.writeFileSync(packageDir + '/package.json', JSON.stringify(packageJSON, null, '\t'))
    fs.writeFileSync(packageDir + '/.gitignore', 'node_modules\n.DS_Store')
    fs.writeFileSync(packageDir + '/README.md', '# ' + packageName)
    writeSuccess('完成\n')

    writeTask('初始化git仓库')
    await spawn('git', ['init'])
    writeSuccess('完成\n')

    writeTask('初始化package.json')
    await spawn('npm', ['init', '--yes'])
    writeSuccess('完成\n')

    writeTask('安装依赖')
    await spawn('npm', ['install'])
    writeSuccess('完成\n')

    writeTask('Git 初次提交')
    await spawn('git', ['add', '.'])
    await spawn('git', ['commit', '-m', '"自动构建,初次提交"'])
    writeSuccess('完成\n')

    console.info('\x1B[31m初始化全部完成,尝试运行Hello World\x1B[39m')
    process.stdout.write(await spawn('npm', ['run', 'test']))

    process.exit()
})()




