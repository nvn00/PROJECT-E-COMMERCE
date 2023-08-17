const render=require('../app')
var express = require('express');
var router = express.Router();
var productHelpers=require('../helpers/product-helpers')
/* GET users listing. */



router.get('/add-products',function(req,res){
  res.render('admin/add-products',{admin:true})
})



router.get('/', function(req, res, next) {
  productHelpers.getAllproducts().then((products)=>{
    res.render('admin/view-products',{admin:true,products})
  })
});
router.post('/add-products',(req,res)=>{
 //////////////////////// // add a callback
  productHelpers.addProduct(req.body,(id)=>{
    let image=req.files.Image
    image.mv('public/product-images/'+id+'.jpg',(err,done)=>{
      if(err){
        console.log("errrrrrrrrrrrrrrrrror",err);
      }
      else{
        res.render("admin/add-products")
      }
    })
  })
})

router.get('/delete-product/',(req,res)=>{
  let proId=req.query.id
  console.log("product id - -",proId);
  productHelpers.deleteProduct(proId).then((response)=>{
    res.redirect('/admin/')
  })

  
})
router.get('/edit-product/:id', async (req,res)=>{
  let product=await productHelpers.getProductDetails(req.params.id)
  console.log(product);
  res.render('admin/edit-product',{product})
})
router.post('/edit-product/:id',(req,res)=>{
console.log(req.params.id)
let id=req.params.id
  productHelpers.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin')
    if(req.files.Images){
      let image=req.files.Image
      image.mv('public/product-images/'+id+'.jpg')
    }
  })
})
module.exports = router;
