#!/usr/bin/env node
const shell = require('@pch18/shell-tools').default
const path = require('path')
const fs = require('fs')

const main = async () => {

    let templateName = await shell.askList('请选择应用类型', ['default', 'plugin'])

    let orgName = await shell.askList('请选择组织名称', {
        '': '{空白}',
        '@pch18/': '@pch18',
        '@pch18run/': '@pch18run',
        custom: '{自定义}'
    })

    if (orgName == 'custom') {
        orgName = await shell.askInput(
            '请输入自定义的组织名称',
            '',
            new RegExp("^@[a-z0-9-~][a-z0-9-._~]*$"),
            '名称不符合规范,必须@开头')
        orgName += '/'
    }

    const packageDir = process.cwd()
    const templateDir = __dirname + '/template_' + templateName
    const packageJSON = require(templateDir + '/package.json')

    const packageName = orgName + await shell.askInput(
        '请输入Package名称(不包含组织名称)',
        path.basename(packageDir).replace(/:/g, '/'),
        new RegExp("^[a-z0-9-~][a-z0-9-._~]*$"),
        '名称不符合规范,不允许使用特殊字符'
    )

    await shell.processSpawn(`cp -Ran ${templateDir}/.  ${packageDir}`, '生成基本文件', true)

    await shell.processDone(() => {
        packageJSON.name = packageName
        fs.writeFileSync(packageDir + '/package.json', JSON.stringify(packageJSON, null, '\t'))
        fs.writeFileSync(packageDir + '/.gitignore', 'node_modules\n.DS_Store')
        fs.writeFileSync(packageDir + '/README.md', '# ' + packageName)
    }, '修改配置信息', true)


    await shell.processSpawn('git init', '初始化git仓库', true)

    await shell.processSpawn('npm init --yes', '初始化package.json', true)

    await shell.processSpawn('npm install', '安装依赖', true)

    await shell.processSpawn([
        'git add .',
        'git commit -m "自动构建,初次提交"'
    ], 'Git 初次提交', true)

    shell.writeln('初始化全部完成,尝试运行Hello World', 'cyan')
    await shell.spawn('npm run test', true)

    shell.exit()
}
main()



