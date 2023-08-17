var express = require ('express')
var router = express.Router();
var productHelpers=require('../helpers/product-helpers')
const userHelpers=require('../helpers/user-helpers');
const { response } = require('../app');
const verifyLogin=(req,res,next)=>{
  if(req.session.userLoggedIn){
    next()
  }else{
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/', async function(req, res, next) {
  let user=req.session.user
  let cartCount=0
  if(req.session.user){
    cartCount=await userHelpers.getCartCount(req.session.user._id)
    //res.render('user/view-products',{products,user,cartCount})
    
  }
    productHelpers.getAllproducts().then((products)=>{
      res.render('user/view-products',{products,user,cartCount})
    })
});


router.get('/login',function(req,res){
  if(req.session.user){
   
    res.redirect('user/login')
  }
  else{
    res.render('user/login',{loginErr:req.session.userLoginErr})
    req.session.userLoginErr=false
  }
})

router.get('/signup',(req,res)=>{
  res.render('user/signup')
})

router.post('/signup',(req,res)=>{
  userHelpers.doSignup(req.body).then((response)=>{
   // console.log(req.body)
    //console.log(response)
    req.session.user=response.user
    req.session.user.loggedIn=true
    res.redirect('/')

  })
})



router.post('/login',(req,res)=>{
  userHelpers.doLogin(req.body).then((response)=>{
    if(response.status){
      
      req.session.user=response.user
      req.session.user.loggedIn=true
      res.redirect('/')
    }else{
      req.session.userLoginErr="invalid username or password"
      res.redirect('/login')
    }
  })
})




router.get('/logout',(req,res)=>{
  req.session.user=null
  req.session.userLoggedIn=false
  res.redirect('/')
})


router.get('/cart',verifyLogin,async(req,res)=>{
  let products=await userHelpers.getCartProduct(req.session.user._id)
    console.log(products);
    let totalValue=0
    if(products.length>0){
      totalValue=await userHelpers.getTotalAmount(req.session.user._id)
    }
    res.render('user/cart',{products,user:req.session.user,totalValue})
})
router.get('/add-to-cart/:id',verifyLogin,(req,res)=>{
  console.log("api called")
  userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.json({status:true})
  })
})

router.post('/change-product-quantity',(req,res,next)=>{
  userHelpers.changeProductQuantity(req.body).then( (response)=>{
   res.json(response)
  })
})

router.get('/place-order',verifyLogin,async (req,res,next)=>{
  let totalValue=await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/place-order',{totalValue,user:req.session.user})
})
router.post('/place-order',async (req,res)=>{
  console.log("form data");
  console.log(req.body);
 
  let products=await userHelpers.getCartProductList(req.body.userId)
  let totalPrice=await userHelpers.getTotalAmount(req.body.userId)
  userHelpers.placeOrder(req.body,products,totalPrice).then((orderId)=>{
    if(req.body['payment-method']==='COD'){
      res.json({codSuccess:true})
    }else{
      userHelpers.generateRazorpay(orderId,totalPrice).then((response)=>{
        res.json(response)

      })
    }
  })
})

router.get('/order-success',verifyLogin,(req,res)=>{
  res.render('user/order-success',{user:req.session.user})
})

router.get('/orders',verifyLogin,async(req,res)=>{
  let orders=await userHelpers.getUserOrders(req.session.user._id)
  res.render('user/orders',{user:req.session.user,orders})
})

router.get('/view-order-products/:id',async (req,res)=>{
  let products=await userHelpers.getOrderProducts(req.params.id)
  console.log(req.params.id);
  res.render('user/view-order-products',{user:req.session.user,products})
})
router.post('/verify-payment',(req,res)=>{
  console.log("paymnet-eee");
  console.log(req.body);
  userHelpers.verifyPayment(req.body).then(()=>{
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      console.log("payment-successfull");
      res.json({status:true})
    })
  }).catch((err)=>{
    console.log(err);
    res.json({status:false,errMsg:''})
  })
})
module.exports = router;
