'use strict'

const jwt = require('jsonwebtoken')
const response = require('../response')
const db = require('../Database/database')
const config = require('./../configuration')
const admzip = require('adm-zip')
const btoa = require('btoa');
const fs = require('fs');

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

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}

exports.addToCollection = async (req, res) => {
    try {
        var tokenPayload = jwt.decode(req.headers.authorization.replace('Bearer ',''));
        if (tokenPayload) {
            if (req.query.id) {
                if (req.query.mod) {
                    db.query("SELECT `author` FROM `collections` WHERE `id` = " + req.query.id, (error, rows) => {
                        if (error) response.send(400, `An error occurred while adding to the collection`, res)
                        else {
                            if (rows[0].author === tokenPayload.user_id) {
                                db.query("INSERT INTO `collection_data` (`mod_id`, `collection_id`) VALUES (" + req.query.mod + ", " + req.query.id + ")", (error, results) => {
                                    if (error) response.send(400, `An error occurred while adding to the collection`, res)
                                    else response.send(200, {message: `Mod has been successfully added to the collection`, results}, res)
                                });
                            } else response.send(400, `You can't change someone else's collection`, res)
                        }
                    });
                } else response.send(400, 'The `mod` parameter is missing', res)
            } else response.send(400, 'The `id` parameter is missing', res)
        } else response.send(400, `Token required`, res)
    } catch (e) {response.send(400, e.toString(), res)}
}

exports.removeFromCollection = async (req, res) => {
    try {
        var tokenPayload = jwt.decode(req.headers.authorization.replace('Bearer ',''));
        if (tokenPayload) {
            if (req.body.id) {
                if (req.body.mods) {
                    db.query("SELECT `author` FROM `collections` WHERE `id` = " + req.body.id, (error, rows) => {
                        if (error) response.send(400, `An error occurred while adding to the collection`, res)
                        else {
                            if (rows[0].author === tokenPayload.user_id) {
                                var modsProcessed = 0;
                                req.body.mods.forEach(item => {
                                    let sql = 'DELETE FROM `collection_data` WHERE `collection_id` = ' + req.body.id + ' AND `mod_id` = ' + item;
                                    db.query(sql, (error, results) => {
                                        modsProcessed++;
                                        if(modsProcessed === req.body.mods.length) {
                                            if(error) response.send(400, error, res)
                                            else response.send(200, {message: `Successful deleted`}, res)
                                        }
                                    })
                                });
                            } else response.send(400, `You can't change someone else's collection`, res)
                        }
                    });
                } else response.send(400, 'The `mod` parameter is missing', res)
            } else response.send(400, 'The `id` parameter is missing', res)
        } else response.send(400, `Token required`, res)
    } catch (e) {response.send(400, e.toString(), res)}
}

exports.addImage = async (req, res) => {
    try {
        var tokenPayload = jwt.decode(req.headers.authorization.replace('Bearer ',''));
        let imageExtentions = ['.jpg', '.jpeg', '.png'];
        if (tokenPayload) {
            if (req.body.id) {
                if (req.files) {
                    db.query("SELECT `author` FROM `collections` WHERE `id` = " + req.body.id, (error, rows) => {
                        if (error) response.send(400, `An error occurred while adding an image to the collection`, res)
                        else {
                            if (rows[0].author === tokenPayload.user_id) {
                                if (Object.prototype.hasOwnProperty.call(req.files, 'image')) {
                                    if (req.files.image.size <= config.UPLOAD_MAX_PICTURE_SIZE) {
                                        if (isExt(req.files.image.name.toLowerCase(), imageExtentions)) {
                                            req.files.image.mv(config.PROJECT_DIR + '/Uploads/Collection/' + req.body.id + ".png") // imageName.substr(imageName.lastIndexOf('.'))
                                                .then(() => {
                                                    let filepath = '/Uploads/Collection/' + req.body.id + ".png" // imageName.substr(imageName.lastIndexOf('.'))
                                                    const sql = "UPDATE `collections` SET `image` = '" + filepath + "' WHERE `id` = " + req.body.id;
                                                    db.query(sql, (error, results) => {
                                                        if(error) response.send(400, error, res)
                                                        else response.send(200, {message: `Collection image successful updated`, results}, res)
                                                    })
                                                }).catch(error => response.send(400, `Image upload failure [${error.message}]`, res))
                                        } else response.send(400, "The image extension should be suitable", res)
                                    } else response.send(400, "The image size must be less than 10 MB", res)
                                } else response.send(400, "You should to upload the image with 'image' attribute", res)
                            } else response.send(400, `You can't change someone else's collection`, res)
                        }
                    });
                } else response.send(400, "You should to upload the image", res)
            } else response.send(400, 'The `id` parameter is missing', res)
        } else response.send(400, "Token required", res)
    } catch (e) {response.send(400, e.toString(), res)}
}

exports.create = async (req, res) => {
    try {
        var tokenPayload = jwt.decode(req.headers.authorization.replace('Bearer ',''));
        if (tokenPayload) {
            const title = req.body.title
            const desc = req.body.description || ''
            if (title) {
                db.query("INSERT INTO `collections` (`author`, `title`, `description`) VALUES ('" + tokenPayload.user_id + "', '" + title + "', '" + desc + "')", (error, results) => {
                    if (error) response.send(400, `An error occurred while creating the collection`, res)
                    else response.send(200, results, res)
                })
            } else response.send(400, `Title required`, res)
        } else response.send(400, `Token required`, res)
    } catch (e) {response.send(400, e.toString(), res)}
}

exports.get = async (req, res) => {
    try {
        if (req.query.id) {
            db.query('SELECT * FROM `collections` WHERE id = ' + req.query.id, (error, rows) => {
                let collectionRows = rows[0];
                if (!error) {
                    var userInfo = null;
                    var modsInfo = [];
                    db.query('SELECT `name`, `profile_picture` FROM `users` WHERE id = ' + collectionRows.author, (error, rows) => {
                        if (!error) {
                            userInfo = rows[0];
                            db.query('SELECT * FROM `collection_data` WHERE collection_id = ' + collectionRows.id, (error, rows) => {
                                if (!error) {
                                    var itemsProcessed = 0;
                                    var dataRows = rows;
                                    
                                    if (dataRows.length) {
                                        dataRows.forEach(item => {
                                            // * category_id
                                            db.query('SELECT `id`,`title`,`preview_description`,`downloads`,`file`,`preview_picture`,`update_date`,`likes` FROM `mods` WHERE id = ' + item.mod_id, (error, rows) => {
                                                if (!error) {
                                                    itemsProcessed++;
                                                    modsInfo.push(rows[0]);
                                                    if(itemsProcessed === dataRows.length) {
                                                        if (userInfo && modsInfo) {
                                                            collectionRows['author_data'] = userInfo;
                                                            collectionRows['collection_mods'] = modsInfo;
                                                            response.send(200, collectionRows, res)
                                                        }
                                                    }
                                                } else response.send(400, error, res)
                                            })
                                        });
                                    } else {
                                        collectionRows['author_data'] = userInfo;
                                        response.send(200, collectionRows, res)
                                    }
                                } else response.send(400, error, res)
                            })
                        } else response.send(400, error, res)
                    })
                } else response.send(400, error, res)
            })
        } else response.send(400, 'The `id` parameter is missing', res)
    } catch (e) {response.send(400, e.toString(), res)}
}

exports.download = async (req, res) => {
    try {
        if (req.query.id) {
            db.query('SELECT * FROM `collection_data` WHERE collection_id = ' + req.query.id, (error, rows) => {
                if (!error) {
                    var itemsProcessed = 0;
                    var dataRows = rows;
                    var files = [];
                    dataRows.forEach(item => {
                        db.query('SELECT `file`, `title` FROM `mods` WHERE id = ' + item.mod_id, (error, rows) => {
                            if (!error) {
                                itemsProcessed++;
                                files.push(rows[0])
                                if(itemsProcessed === dataRows.length) {
                                    let collectionPath = config.PROJECT_DIR + "/Uploads/Temp/" + removeForbiddenCharacters(btoa(getRandomInt(9999, 999999)))
                                    var archiveProcessed = 0;
                                    files.forEach(item => {
                                        try {
                                            archiveProcessed++;
                                            var zip = new admzip(config.PROJECT_DIR + item.file);
                                            zip.extractAllTo(`${collectionPath}/${item.title}`, false);
                                            if (archiveProcessed === files.length) {
                                                let finalArchivePath = config.PROJECT_DIR + "/Uploads/Temp/" + removeForbiddenCharacters(btoa(getRandomInt(9999, 999999))) + '.zip';
                                                var finalZip = new admzip();
                                                finalZip.addLocalFolder(collectionPath);
                                                finalZip.writeZip(finalArchivePath);
                                                
                                                if (fs.existsSync(finalArchivePath)) {
                                                    res.download(finalArchivePath, "Collection.zip", (err) => {
                                                        if (err) response.send(400, err, res)
                                                        else {
                                                            try {fs.rmdirSync(collectionPath, { recursive: true }); fs.unlinkSync(finalArchivePath);}
                                                            catch (e) {response.send(400, e.toString(), res)}

                                                            db.query('SELECT * FROM `collections` WHERE id = ' + req.query.id, (error, rows, fields) => {
                                                                if (!error) db.query("UPDATE `collections` SET `downloads` = '" + (rows[0].downloads + 1) + "' WHERE `collections`.`id` = " + req.query.id)
                                                            })
                                                        }
                                                    });
                                                } else response.send(400, `An error occurred while downloading`, res)
                                            }
                                        } catch (e) {response.send(400, e.toString(), res)}
                                    });
                                }
                            } else response.send(400, error, res)
                        })
                    });
                } else response.send(400, error, res)
            })
        } else response.send(400, 'The `id` parameter is missing', res)
    } catch (e) {response.send(400, e.toString(), res)}
}