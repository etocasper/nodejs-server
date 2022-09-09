const express = require('express')
const app = express()
const port = process.env.PORT || 3500
const bodyParser = require('body-parser')
const routes = require('./routes')
const passport = require('passport')
const fileUpload = require('express-fileupload');
const config = require('./configuration')

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(passport.initialize())
app.use(fileUpload({}));

require('./Middleware/passport')(passport)

routes(app)

// ---------------------------------------------------------------------------------------
app.use('/uploads/', express.static(config.PROJECT_DIR + '/Uploads/Previews/'));
app.use('/uploads/', express.static(config.PROJECT_DIR + '/Uploads/Details/'));
app.use('/uploads/', express.static(config.PROJECT_DIR + '/Uploads/ProfilePictures/'));
// ---------------------------------------------------------------------------------------

app.listen(port, () => {
    console.clear();
    var now = new Date();
    var startedTime = (now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds());
    console.log(`[APP] App listen on port ${port} | Started at: ${startedTime}`);
})
