const express = require('express'),
    path = require('path'),
    bodyParser = require('body-parser'),
    dust = require('express-dustjs'),
    app = express();

const config = {
    user: 'eduonix',
    host: 'localhost',
    database: 'recipebook_db',
    password: '12345',
    port: 5432,
}

const Pool = require('pg-pool');
const pool = new Pool(config);

dust._.optimizers.format = function (ctx, node) {
    return node
}

// Define custom Dustjs helper
dust._.helpers.demo = function (chk, ctx, bodies, params) {
    return chk.w('demo')
}



app.engine('dust', dust.engine({
    // Use dustjs-helpers
    useHelpers: true
}));
app.set('view engine', 'dust');
app.set('views', path.resolve(__dirname, './views'));

app.use(express.static(path.join(__dirname, 'public')));


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.get('/', (req, res) => {
    pool.connect().then(client => {
        client.query('SELECT * FROM recipe as recipes', ).then(result => {
            client.release();
            res.render('index', {recipes: result.rows} );
        })
            .catch(e => {
                client.release();
                console.error('query error', e.message, e.stack);
            })
    })
    .catch(e => {
        console.error('connection error', e.message, e.stack)
    })

});

app.post('/add', (req, res) => {
    pool.connect().then(client => {
        client.query('INSERT INTO recipe(name, ingredients, directions) VALUES ($1, $2, $3)',
            [req.body.name, req.body.ingredients, req.body.directions])
            .then(result => {
                client.release();
                res.redirect('/');
        })
            .catch(e => {
                client.release();
                console.error('query error', e.message, e.stack);
        })
    })
    .catch(e => {
        console.error('connection error', e.message, e.stack)
    })

});

app.delete('/delete/:id', (req,res) => {
    pool.connect().then(client => {
        client.query('DELETE FROM recipe WHERE id = $1',[req.params.id] ).then(result => {
            client.release();
            res.sendStatus(200);
        })
            .catch(e => {
                client.release();
                console.error('query error', e.message, e.stack);
            })
    })
        .catch(e => {
            console.error('connection error', e.message, e.stack)
        })

});

app.post('/edit', function (req, res) {
    pool.connect().then(client => {
        client.query('UPDATE recipe SET name=$1, ingredients=$2, directions=$3 WHERE id=$4',
            [req.body.name, req.body.ingredients, req.body.directions, req.body.id])
            .then(result => {
                client.release();
                res.redirect('/');
            })
            .catch(e => {
                client.release();
                console.error('query error', e.message, e.stack);
            })
    })
        .catch(e => {
            console.error('connection error', e.message, e.stack)
        })

});

//server

app.listen(3000, ()=>{
    console.log('Server running at http://localhost:3000');
});
