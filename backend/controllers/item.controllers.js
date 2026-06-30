import uploadOnCloudinary from './../utils/cloudinary.js';
import Shop from './../models/shop.model.js';
import Item from '../models/item.model.js';
import { createEditShop } from './shop.controllers.js';
import { EVENTS } from './../constants/events.js';

export const addItem = async (req, res) => {
    try {
        const {name, category, foodType, price} = req.body
        let image;
        if(req.file){
            const uploadImage = await uploadOnCloudinary(req.file.path)
            image = uploadImage
        }
        const shop = await Shop.findOne({owner:req.userId})
        if(!shop){
            return res.status(400).json({meassage: "shop not found"})
        }
        const item = await Item.create({
            name, category, foodType, price, image, shop:shop._id
        })

        shop.items.push(item._id)
        await shop.save()
        await shop.populate("owner")
        await shop.populate({
            path:"items",
            options:{sort:{updatedAt:-1}}
        })

        const io = req.app.get("io");
        
        io.to(shop.city).emit(EVENTS.ITEM_ADDED, {
            item,
            city: shop.city,
        });

        return res.status(201).json(shop)

    } catch (error) {
        return res.status(500).json({message:`add item error ${error}`})
    }
}

export const editItem = async (req, res) => {
    try {
        const itemId = req.params.itemId
        const {name, category, foodType, price} = req.body

        const updateData = {
            name, category, foodType, price
        }

        if(req.file){
            const uploadImage = await uploadOnCloudinary(req.file.path)
            updateData.image = uploadImage
        }

        const item = await Item.findByIdAndUpdate(
            itemId,
            updateData,
            { new: true }
        )

        if(!item){
            return res.status(400).json({
                message:"Item not found"
            })
        }

        const shop = await Shop.findOne({
            owner:req.userId
        })
        await shop.populate("owner")
        await shop.populate({
            path:"items",
            options:{sort:{updatedAt:-1}}
        })

        const io = req.app.get("io");

        io.to(shop.city).emit(EVENTS.ITEM_UPDATED, {
            item,
            city: shop.city,
        });
        
        return res.status(200).json(shop)


    } catch (error) {
        console.log(error)
        return res.status(500).json({meassage: `edit Item error ${error}`})
    }
}

export const getItemById = async (req, res) => {
    try {
        const itemId = req.params.itemId
        const item = await Item.findById(itemId)
        if(!item){
            return res.status(400).json({meassage: `Item not found`})
        }
        return res.status(200).json(item)
    } catch (error) {
        return res.status(500).json({meassage: `get Item error ${error}`})
    }
}

export const deleteItem = async(req, res) => {
    try {
        const itemId = req.params.itemId
        const item = await Item.findByIdAndDelete(itemId)
        if(!item){
            return res.status(400).json({meassage: `Item not found`})
        }
        const shop = await Shop.findOne({owner:req.userId})
        shop.items = shop.items.filter(i => i.toString() !== item._id.toString())

        await shop.save()
        await shop.populate("owner")
        await shop.populate({
            path:"items",
            options:{sort:{updatedAt:-1}}
        })

        const io = req.app.get("io");

        io.to(shop.city).emit(EVENTS.ITEM_DELETED, {
            itemId: item._id,
            shopId: shop._id,
            city: shop.city
        });

        return res.status(200).json(shop)
    } catch (error) {
        return res.status(500).json({
            meassage: `delete Item error ${error.message}`
        })
    }
}

export const getItemByCity = async (req, res) => {
    try {
        const {city} = req.params

        if(!city){
            return res.status(400).json({
                message: "city is reuired"
            });
        }

        const shops = await Shop.find({
            city: { $regex: new RegExp(`^${city}$`, "i") },
            isOpen: true
            }).populate("items");
        
        if (shops.length === 0) {
            return res.status(404).json({
                message: "items not found"
            });
        }
        
        const shopIds = shops.map((shop) => shop._id)

        const items = await item.find({shop: {$in: shopIds}}).
        populate("shop", "name isOpen")

        return res.status(200).json(items)

    } catch (error) {
        return res.status(500).json({
            meassage: `get Item by city error ${error.message}`
        })
    }
}

export const getItemsByShop = async (req, res) => {
    try {
        const {shopId} =  req.params
        const shop = await Shop.findById(shopId).populate("items")
        if(!shop){
            return res.status(400).json("shop not found")
        }
        return res.status(200).json({
            success: true, shop, items: shop.items
        })

    } catch (error) {
        return res.status(500).json({
            meassage: `get Item by shop error ${error.message}`
        })
    }
}

export const searchItems = async (req, res) => {
    try {
        const {query, city} = req.query
        if(!query || !city){
            return res.status(400).json({
                message: "Query and city are required"
            });
        }

        const shops = await Shop.find({
            city: { $regex: new RegExp(`^${city}$`, "i") },
            isOpen: true
        })
        .populate("items");

        if (!shops) {
            return res.status(404).json({message: "shops not found"});
        }
        const shopIds = shops.map(s => s._id)

        const items = await Item.find({
            shop:{$in: shopIds},
            $or:[
                {name: {$regex: `\\b${query}`, $options: "i"}},
            ]
        }).populate("shop", "name image")

        return res.status(200).json(items)

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            meassage: `search Item error ${error.message}`
        })
    }
}

export const rating = async (req, res) => {
    try {
        const {itemId, rating} = req.body
        if(!itemId || !rating){
            return res.status(400).json({meassage: "itemId and rating is require"})
        }
        if(rating < 1 || rating > 5){
            return res.status(400).json({meassage: "rating must be between 1 to 5"})
        }
        const item = await Item.findById(itemId)
        if(!item){
            return res.status(400).json({meassage: "item not found"})
        }

        const newCount = item.rating.count + 1;
        const newAverage = (
            (item.rating.average * item.rating.count) + rating)/newCount

        item.rating.count = newCount;
        item.rating.average = newAverage;

        await item.save()

        const io = req.app.get("io");
        
            io.emit(EVENTS.ITEM_RATED, {
                itemId: item._id,
                rating: item.rating
            });
        return res.status(200).json({rating: item.rating})
        
        } catch (error) {
            console.log(error)
            return res.status(400).json({meassage: `item rating error, ${error}`})
    }
}
