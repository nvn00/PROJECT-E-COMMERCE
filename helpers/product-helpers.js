var db=require('../config/connection')
var collections=require('../config/collections')

var objectId=require('mongodb').ObjectId




module.exports={
    addProduct:(product,callback)=>{
      
       product.Price=parseInt(product.Price)
        db.get().collection('product').insertOne(product).then((data)=>{
            
           
            callback(data.insertedId.toString())
        })
     
    },
    getAllproducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collections.PRODUCT_COLLLECTIONS).find().toArray()
            resolve(products)
        })
    },
    deleteProduct:(prodId)=>{
        return new Promise((resolve,reject)=>{
            console.log(prodId);
           
            db.get().collection(collections.PRODUCT_COLLLECTIONS).deleteOne({_id:new objectId(prodId)}).then((response)=>{
                console.log(response);
                resolve(response)
            })
        })
    },
    getProductDetails:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.PRODUCT_COLLLECTIONS).findOne({_id:new objectId(proId)}).then((product)=>{
                resolve(product)
            })
        })
    },
    updateProduct:(proId,productDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.PRODUCT_COLLLECTIONS).updateOne({_id:new objectId(proId)},{
                $set:{
                        Name:productDetails.Name,
                        Description:productDetails.Description,
                        Price:parseInt(productDetails.Price),
                        Catagory:productDetails.Catagory
                }
            }).then((response)=>{
                resolve()
            })
        })
    }
}