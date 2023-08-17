var db=require('../config/connection')
var collections=require('../config/collections')
const bcrypt=require('bcrypt')
// const { Collection } = require('mongodb')
var objectId=require('mongodb').ObjectId
var Razorpay = require('razorpay');

var instance = new Razorpay({
  key_id: 'rzp_test_ISLaCu12OAuTIG',
  key_secret: 'dYW88Aoz6jglqO2cYC7qmPWz',
});

module.exports={
    doSignup:(userData)=>{
       
        return new Promise(async (resolve,reject)=>{
            userData.Password=await bcrypt.hash(userData.Password,10)
            db.get().collection(collections.USER_COLLLECTIONS).insertOne(userData).then((data)=>{
                
                resolve(data)
               
            })
        })
    },
    doLogin:(userData)=>{
      
        return new Promise(async (resolve,reject)=>{
            let loginStatus=false
            let response={}
            let user=await db.get().collection(collections.USER_COLLLECTIONS).findOne({
                Email:userData.Email})
                
            if(user){
                
                bcrypt.compare(userData.Password,user.Password).then((status)=>{
                   
                    if(status){
                        console.log('login success')
                        response.user=user
                        response.status=true
                        resolve(response)
                    }else{
                        console.log('login failed');
                        resolve(response)
                    }
                })
            }else{
                console.log('login failed');
                resolve(response)
            }
        })
    },
    addToCart:(proId,userId)=>{
        let proObj={
            item:new  objectId(proId),
            quantity:1
            }

      
        return new Promise(async (resolve,reject)=>{
            let userCart=await db.get().collection(collections.CART_COLLECTION).findOne({
                user:new objectId(userId)
            })
            if(userCart){//alredy have a cart the pussh products into it
                let proExist=userCart.products.findIndex(product=>product.item==proId)
    
                if(proExist!=-1){//if there is no products in the datbase
                        db.get().collection(collections.CART_COLLECTION).updateOne({user:new objectId(userId),'products.item':new objectId(proId)},
                        {
                            $inc:{'products.$.quantity':1}
                        }).then(()=>{
                            resolve()
                        })
                        
                }else{
                    

                    db.get().collection(collections.CART_COLLECTION).updateOne({
                        user: new objectId(userId)},
                        {

                            $push:{products:proObj}
    
                        }).then((response)=>{
                            resolve()
                        })

                }

                

            }else{//creating cart
                let cartObj={
                    user:new objectId(userId),
                    products:[proObj]
                }
                db.get().collection(collections.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                    resolve()
                })
            }
        })
    },
    getCartProduct:(userId)=>{
        return new Promise(async (resolve,reject)=>{
            let cartItems= await db.get().collection(collections.CART_COLLECTION).aggregate([
                {
                    $match:{user:new objectId(userId)}
                 },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collections.PRODUCT_COLLLECTIONS,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,
                        quantity:1,
                        product:{
                            $arrayElemAt:['$product',0]
                        }
                    }
                }
                
            ]).toArray()
           
            resolve(cartItems)
        })
       
    },
    getCartCount:(userId)=>{
        return new Promise(async (resolve,reject)=>{
            let count=0
            let cart=await db.get().collection(collections.CART_COLLECTION).findOne({user:new objectId(userId)})
            if(cart){
                count=cart.products.length
            }
            resolve(count)
        })
    },
    changeProductQuantity:({cart,product,type})=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.CART_COLLECTION).updateOne({_id:new objectId(cart),'products.item':new objectId(product)},
                        {
                            $inc:{'products.$.quantity':type==='increment' ? 1 : -1} 
                        }).then((response)=>{
                            resolve({status:true})
                        })

        })
    },
    getTotalAmount:(userId)=>{
        return new Promise(async (resolve,reject)=>{
            let total= await db.get().collection(collections.CART_COLLECTION).aggregate([
                {
                    $match:{user:new objectId(userId)}
                 },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collections.PRODUCT_COLLLECTIONS,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,
                        quantity:1,
                        product:{
                            $arrayElemAt:['$product',0]
                        }
                    }
                },
                {
                    $group:{
                        _id:null,
                        
                        total:{$sum:{$multiply:['$quantity','$product.Price']}}
                    }
                }
                
            ]).toArray()
            resolve(total[0].total)
        })

    },
    placeOrder:(order,products,total)=>{
       console.log("here sda",order);
        return new Promise((resolve,reject)=>{
            let status=order['payment-method']==='COD'?'placed':'pending'
            let orderObj={
                deliveryDetails:{
                    mobile:order.mobile,
                    address:order.address,
                    pincode:order.pincode
                },
                userId:new objectId(order.userId),
                paymentMethod:order['payment-method'],
                products:products,
                totalAmount:total,
                date:new Date,
                status:status
               
            }
            db.get().collection(collections.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                db.get().collection(collections.CART_COLLECTION).deleteOne({user:new objectId(order.userId)})
                resolve(response.insertedId)
            })
        })
    },
    getCartProductList:(userId)=>{
        return new Promise(async (resolve,reject)=>{
            let cart=await db.get().collection(collections.CART_COLLECTION).findOne({user:new objectId(userId)})
            resolve(cart.products)
        })
    },
    getUserOrders:(userId)=>{
        return new Promise(async (resolve,reject)=>{
            let order=await db.get().collection(collections.ORDER_COLLECTION).find({userId:new objectId(userId)}).toArray()
            resolve(order)
        })
    },
    getOrderProducts:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
            let orderItem=await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $match:{_id:new objectId(orderId)}
                 },
                {
                    $unwind:'$products'
                },
                
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collections.PRODUCT_COLLLECTIONS,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,
                        quantity:1,
                        product:{
                            $arrayElemAt:['$product',0]
                        }
                    }
                }
            ]).toArray()
            resolve(orderItem)
        })
    },
    generateRazorpay:(orderId,total)=>{
        console.log("order id is ",orderId);
        return new Promise((resolve,reject)=>{
            var options = {
                amount: total*100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: ""+orderId
              };
              instance.orders.create(options, function(err, order) {
                resolve(order)
              });
        })
    },
    verifyPayment:(details)=>{
        return new Promise(async(resolve,reject)=>{
            const crypto=require('crypto')
            const {
                createHmac,
              } = await import('node:crypto');
              
            var hmac = createHmac('sha256', 'dYW88Aoz6jglqO2cYC7qmPWz');

            hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
            hmac=hmac.digest('hex')
            if(hmac==details['payment[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }
        })

    },
    changePaymentStatus:(orderId)=>{
        console.log("orderid",orderId)
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.ORDER_COLLECTION)
            .updateOne({_id:new objectId(orderId)},
            {
                $set:{
                    status :'placed'
                }
            }).then(()=>{
                resolve()
            })
        })

    }

}