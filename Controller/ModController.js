'use strict'

const jwt = require('jsonwebtoken')
const response = require('../response')
const db = require('../Database/database')
const config = require('./../configuration')
const btoa = require('btoa');

function removeForbiddenCharacters(input) {
    let forbiddenChars = ['/', '?', '&','=','.','"', " "]
    for (let char of forbiddenChars)
        input = input.split(char).join('');
    return input
}

function isExt(filename, extensions /* ['.exe', '.pdf', '.etc'] */) {
    var i = filename.lastIndexOf('.');
    return (i < 0) ? false : (extensions.includes(filename.substr(i)));
}

function hasProperty(target, name) {
    return Object.prototype.hasOwnProperty.call(target, name) ? true : false
}


exports.search = async (req, res) => {
    try {
        if (req.query.query) {
            db.query(`SELECT * FROM mods WHERE title LIKE '%${req.query.query}%'`, (error, rows) => {
                if (!error) response.send(200, rows, res)
                else response.send(400, error, res)
            })
        } else response.send(400, 'The `id` parameter is missing', res)
    } catch (e) {response.send(400, e.toString(), res)}
}

exports.getModInfo = async (req, res) => {
    try {
        if (req.query.id) {
            db.query('SELECT * FROM `mods` WHERE id = ' + req.query.id, (error, rows) => {
                let modRows = rows[0];
                if (!error) {
                    db.query('SELECT `path` FROM `mod_pictures` WHERE mod_id = ' + req.query.id, (error, rows) => {
                        if (!error) {
                            let pathArr = []
                            rows.forEach(item => pathArr.push(item.path));
                            modRows['detail_pictures'] = pathArr;
                            response.send(200, modRows, res)
                        } else response.send(400, error, res)
                    })
                } else response.send(400, error, res)
            })
        } else response.send(400, 'The `id` parameter is missing', res)
    } catch (e) {response.send(400, e.toString(), res)}
}

exports.getAllMods = async (req, res) => {
    try {
        db.query('SELECT * FROM mods', (error, rows) => {
            if (error) response.send(400, error, res)
            else response.send(200, rows, res)
        })
    } catch (e) {response.send(400, e.toString(), res)}
}

exports.upload = async (req, res) => {
    try {
        let imageExtentions =   ['.jpg', '.jpeg', '.png'];
        let archiveExtentions = ['.zip', '.7zip', '.rar'];
        var tokenPayload = jwt.decode(req.headers.authorization.replace('Bearer ',''));
        const title = req.body.title
        const preview_description = req.body.preview_description || ''
        const detail_description = req.body.detail_description || ''
        const preview_picture = ''
        const detail_picture = ''
        const category_id = req.body.category_id

        var modResults = null;

        if (req.files) {
            if (hasProperty(req.files, 'archive')) {
                if (req.files.archive.size <= config.UPLOAD_MAX_FILE_SIZE) {
                    if (isExt(req.files.archive.name, archiveExtentions)) {
                        let archiveName = req.files.archive.name;
                        req.files.archive.mv(config.PROJECT_DIR + '/Uploads/Mods/' + removeForbiddenCharacters(btoa(title + archiveName)) + archiveName.substr(archiveName.lastIndexOf('.')))
                            .then(() => {
                                let filepath = '/Uploads/Mods/' + removeForbiddenCharacters(btoa(title + archiveName)) + archiveName.substr(archiveName.lastIndexOf('.'))
                                const sql = "INSERT INTO `mods` (`title`, `preview_description`, `detail_description`, `preview_picture`, `category_id`, `file`, `user_id`)VALUES('" + title + "', '" + preview_description + "', '" + detail_description + "', '" + preview_picture + "','" + category_id + "','" + filepath + "','" + tokenPayload.user_id + "')";
                                db.query(sql, (error, results) => {
                                    if (error) response.send(400, error, res)
                                    else {
                                        modResults = results;
                                        let insertedModId = results.insertId;
                                        if (hasProperty(req.files, 'preview')) {
                                            if (req.files.preview.size <= config.UPLOAD_MAX_PICTURE_SIZE) {
                                                if (isExt(req.files.preview.name.toLowerCase(), imageExtentions)) {
                                                    req.files.preview.mv(config.PROJECT_DIR + '/Uploads/Previews/' + insertedModId + ".png");
                                                        .then(() => {
                                                            let filepath = '/Uploads/Previews/' + insertedModId + ".png";
                                                            const sql = "UPDATE `mods` SET `preview_picture` = '" + filepath + "' WHERE `mods`.`id` = " + insertedModId;
                                                            db.query(sql, (error, results) => {
                                                                if(error) response.send(400, error, res)
                                                                else {
                                                                    if (hasProperty(req.files, 'detail')) {
                                                                        var detailsProcessed = 0;
                                                                        req.files.detail.forEach(file => {
                                                                            try {
                                                                                if (file.size <= config.UPLOAD_MAX_PICTURE_SIZE) {
                                                                                    if (isExt(file.name.toLowerCase(), imageExtentions)) {
                                                                                        file.mv(config.PROJECT_DIR + '/Uploads/Details/' + removeForbiddenCharacters(btoa(file.name.toLowerCase() + insertedModId)) + ".png") // imageName.substr(imageName.lastIndexOf('.'))
                                                                                            .then(() => {
                                                                                                let filepath = '/Uploads/Details/' + removeForbiddenCharacters(btoa(file.name.toLowerCase() + insertedModId)) + ".png" // imageName.substr(imageName.lastIndexOf('.'))
                                                                                                const sql = "INSERT INTO `mod_pictures` (`mod_id`, `path`) VALUES ('" + insertedModId + "', '" + filepath + "')";
                                                                                                db.query(sql, (error, results) => {
                                                                                                    detailsProcessed++;
                                                                                                    if(detailsProcessed === req.files.detail.length) {
                                                                                                        if(error) response.send(400, error, res)
                                                                                                        else response.send(200, {message: `Successful mod upload`, modResults}, res)
                                                                                                    }
                                                                                                })
                                                                                            }).catch(error => response.send(400, `Image upload failure [${error.message}]`, res))
                                                                                    } else response.send(400, "The image extension should be suitable", res)
                                                                                } else response.send(400, "The image size must be less than 10 MB", res)
                                                                            } catch (error) { response.send(400, error, res) }
                                                                        });
                                                                    } else response.send(200, {message: `Successful mod upload`, modResults}, res)
                                                                }
                                                            })
                                                        }).catch(error => response.send(400, `Image upload failure [${error.message}]`, res))
                                                } else response.send(400, "The image extension should be suitable", res)
                                            } else response.send(400, "The image size must be less than 10 MB", res)
                                        } else response.send(200, {message: `Successful mod upload`, modResults}, res)
                                    }
                                })
                            }).catch(error => response.send(400, `File upload failure [${error.message}]`, res))
                    } else response.send(400, "The file must be a zip archive", res)
                } else response.send(400, "The file size must be less than 40 MB", res)
            } else response.send(400, "You should to upload the archive with your mod with 'archive' attribute", res)
        } else response.send(400, "You should to upload the archive with your mod", res)
    } catch (e) {response.send(400, e.toString(), res)}
}

exports.download = async (req, res) => {
    try {
        if (req.query.id) {
            db.query('SELECT * FROM `mods` WHERE `id` = ' + req.query.id, (error, rows, fields) => {
                if (!error) {
                    try {
                        if (rows[0]) {
                            let filenameForDownload = (removeForbiddenCharacters(rows[0].title) + rows[0].file.substr(rows[0].file.lastIndexOf('.')));
                            res.download(config.PROJECT_DIR + rows[0].file, filenameForDownload, err => {
                                if (!err) {
                                    db.query('SELECT * FROM `mods` WHERE id = ' + req.query.id, (error, rows, fields) => {
                                        if (!error) db.query("UPDATE `mods` SET `downloads` = '" + (rows[0].downloads + 1) + "' WHERE `mods`.`id` = " + req.query.id)
                                    })
                                } else response.send(400, err, res)
                            })
                        } else response.send(400, `Unable to get file data`, res)
                    } catch (e) {response.send(400, e.toString(), res)}
                } else response.send(400, error, res)
            })
        } else response.send(400, 'The `id` parameter is missing', res)
    } catch (e) {response.send(400, e.toString(), res)}
}
