var express = require('express')
var session = require('express-session')
const async = require('hbs/lib/async')
var app = express()

var MongoClient = require('mongodb').MongoClient
var url = 'mongodb+srv://hvh02:lemxinhdep0512@cluster0.vmqm2.mongodb.net/test'   


app.set('view engine','hbs')
app.use(express.urlencoded({extended:true}))
app.use(session({
    secret: 'my secrete !@#$$%%@@$%$@#%%@#%##',
    resave: false
}))

//home
app.get('/',isAuthenticated, async (req,res)=>{
    let Notauthen = !req.session.userName
    let server = await MongoClient.connect(url)
    let dbo = server.db("ATNToys")
    let products = await dbo.collection('product').find().toArray()
    res.render('home',{'products':products,'Notauthen':Notauthen})
})


//search
app.post('/search',async (req,res)=>{
    let name = req.body.txtName

    let server = await MongoClient.connect(url)

    let dbo = server.db("ATNToys")

    let products = await dbo.collection('product').find({'name': new RegExp(name,'i')}).toArray()
    res.render('home',{'products':products})
})

//create (post)
app.post('/newProduct', async (req,res)=>{
    let name = req.body.txtName
    let price = req.body.txtPrice
    let picture = req.body.txtPicture
    if(name.length <= 5){
        res.render('newProduct', {'nameError':'Name must have atlease 5 letters'})
        return
    }

    let product = {
        'name': name,
        'price': price,
        'picture': picture
    }

    let server = await MongoClient.connect(url)
    let dbo = server.db("ATNToys")
    await dbo.collection("product").insertOne(product)
    res.redirect('/')
})

//insert get
app.get('/insert',(req,res)=>{
    res.render("newProduct")
})

app.get('/delete/:_id', async (req, res) => {
    //transform your param into an ObjectId
    var id = req.params._id;
    var id2 = new ObjectId(id);

    let server = await MongoClient.connect(url) 
    let dbo = server.db("ATNToys")
    await dbo.collection('product').deleteOne({'_id': id2})
    res.redirect('/')
})




//logout
app.get('/logout',(req,res)=>{
    req.session.userName = null
    req.session.save((err)=>{
        req.session.regenerate((err2)=>{
            res.redirect('/login')
        })
    })
})

//authen
function isAuthenticated(req,res,next){
    let Notauthen = !req.session.userName
    if(Notauthen)
        res.redirect('/login')
    else
        next()
}

app.post('/account',async (req,res)=>{
    let name = req.body.txtName
    let pass = req.body.txtPass
    req.session.userName = name
    req.session.password = pass
    let server = await MongoClient.connect(url)
    let dbo = server.db("ATNToys")
    let result = await dbo.collection("users").find({$and :[{'name':name},{'pass':pass}]}).toArray()
    if(result.length >0){
        res.redirect('/profile')
    }else{
        res.write('Denied')
        res.end()
    }    
})

app.get('/profile',isAuthenticated, async (req,res)=>{
    let server = await MongoClient.connect(url)
    let dbo = server.db("ATNToys")
    let user = await dbo.collection("users").find({$and :[{'name':req.session.userName},{'pass':req.session.password}]}).limit(1).toArray()
    res.render('profile',{'name': req.session.userName,'sId':req.session.id,'user':user[0]})
})

app.get('/login',(req,res)=>{
    let Notauthen = !req.session.userName
    res.render('login',{'Notauthen':Notauthen})
})






const PORT = process.env.PORT || 5000
app.listen(PORT )
console.log('Server is running!')
