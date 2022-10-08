const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const { body, validationResult, check } = require('express-validator');
const methodOverride = require('method-override');

const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');

require('./utilities/db');
const Contact = require('./model/contact');

const app = express();
const port = 3000;

// setup method-override
app.use(methodOverride('_method'));

// Setup EJS
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));

// konfigurasi flash
app.use(cookieParser('secret'));
app.use(
    session({
        cookie: {maxAge: 6000},
        secret: 'secret',
        resave: true,
        saveUninitialized: true,
    })
);
app.use(flash());

// Halaman Home
app.get('/', (req, res) => {
    const mahasiswa = [
    {
        nama: 'Aceng',
        email: 'aceng@gmail.com'
    },
    ]

    res.render('index', {
        nama: 'Hasyim Kicuyy', 
        title: 'Home Page', 
        mahasiswa: mahasiswa,
        layout: 'layouts/main-layout'
    });
});

// Halaman About
app.get('/about', (req, res) => {
    res.render('about', {
        title: 'About Page',
        layout: 'layouts/main-layout',
    });
});

// Halaman Contact
app.get('/contact', async(req, res) => {
    // Contact.find().then((contact) => {
    //     res.send(contact);
    // }); 

    const contacts = await Contact.find();

    res.render('contact', {
        title: 'Contact Page',
        layout: 'layouts/main-layout',
        contacts: contacts,
        msg: req.flash('msg'),
    });
});

// halaman tambah data contact
app.get('/contact/add', (req, res) => {
    res.render('add-contact', {
        title: 'Form Tambah Data Page',
        layout: 'layouts/main-layout',
    });
});

// prosestambah data contact
app.post('/contact', 
    [
        body('nama').custom(async(value) => {
            const duplikat = await Contact.findOne({ nama: value });
            if(duplikat) {
                throw new Error('Nama kontak sudah digunakan!');
            }
            return true;
        }),
        check('email', 'Email tidak valid!').isEmail(),
        check('nohp', 'No HP tidak valid!').isMobilePhone('id-ID'),
    ],
    (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            res.render('add-contact', {
                title: 'Form Tambah Data Page',
                layout: 'layouts/main-layout',
                errors: errors.array(),
            });
        } else {
            Contact.insertMany(req.body, () => {
                req.flash('msg', 'Data Kontak Berhasil Ditambahkan!');
                res.redirect('/contact');
            });
        }
    }
);

// proses delete contact
// app.get('/contact/delete/:nama', async(req, res) => {
//     const contact = await Contact.findOne({ nama: req.params.nama });

//     if(!contact) {
//         res.status(404);
//         res.send('<h1>404 | Not Found</h1>')
//     } else {
//         Contact.deleteOne({ _id: contact._id }).then(() => {
//             req.flash('msg', 'Data Berhasil Dihapus!');
//             res.redirect('/contact');
//         });
//     }
// });
app.delete('/contact', (req, res) => {
    Contact.deleteOne({ nama: req.body.nama }).then(() => {
        req.flash('msg', 'Data Berhasil Dihapus!');
        res.redirect('/contact');
    });
});

// Halaman form edit data contact
app.get('/contact/edit/:nama', async(req, res) => {
    const contact = await Contact.findOne({ nama: req.params.nama });

    res.render('edit-contact', {
        title: 'Form Edit Data Kontak',
        layout: 'layouts/main-layout',
        contact: contact,
    });
});

// proses edit data
app.put('/contact', [body('nama').custom(async(value, { req }) => {
    const duplikat = await Contact.findOne({ nama: value });
    if(value !== req.body.oldName && duplikat) {
        throw new Error('Nama sudah dipakai!');
    }
    return true;
    }), check('email', 'Email tidak valid!').isEmail(), check('nohp', 'No HP tidak valid!').isMobilePhone('id-ID')], (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        res.render('edit-contact', {
            title: 'Form Edit Data Kontak',
            layout: 'layouts/main-layout',
            errors: errors.array(),
            contact: req.body,
        });
    } else {
        Contact.updateOne(
            { _id: req.body._id }, 
            {
                $set: {
                    nama: req.body.nama,
                    email: req.body.email,
                    nohp: req.body.nohp,
                }   
            }
        ).then(() => {
            req.flash('msg', 'Data berhasil diubah!');
            res.redirect('/contact');
        });
    }
});


// Halaman detail contact
app.get('/contact/:nama', async(req, res) => {
    const contact = await Contact.findOne({nama: req.params.nama});

    res.render('detail', {
       title: 'Detail Page',
       layout: 'layouts/main-layout',
       contact: contact, 
    });
});


app.listen(port, () => {
    console.log(`Mongo Contact App | Listening at http://localhost:${port}`);
});




