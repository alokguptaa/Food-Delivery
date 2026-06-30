import Shop from "../models/shop.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { EVENTS } from "../constants/events.js";


export const createEditShop = async (req, res) => {
    try {
        const {name, city, state, address, openingTime, closingTime} = req.body

        let image;
        if(req.file){
            image = await uploadOnCloudinary(req.file.path)
        }

        let shop = await Shop.findOne({owner:req.userId})
        let isNewShop = false;
        if(!shop){
            shop = await Shop.create({
            name, city, state, address, image, owner:req.userId, openingTime, closingTime
        })
        }else {
            const updateData = {
                name, city, state, address, owner: req.userId, openingTime, closingTime
            };
            if (image) {
                updateData.image = image;
            }
            shop = await Shop.findByIdAndUpdate(
                shop._id,
                updateData,
                {  returnDocument: "after" }
            );
        }
        await shop.populate("owner")
        await shop.populate("items")

        const io = req.app.get("io");

        if (isNewShop) {
            io.to(shop.city).emit(EVENTS.SHOP_ADDED, shop);
        } else {
            io.to(shop.city).emit(EVENTS.SHOP_UPDATED, shop);
        }


        return res.status(201).json(shop)
    } catch (error) {
        return res.status(500).json({message: `create shop error ${error}`})
    }
}

export const getMyShop = async (req, res) => {
    try {
        const shops = await Shop.findOne({owner:req.userId})
        .populate("owner")
        .populate({
            path:"items",
            options:{sort:{updatedAt: -1}}
        })

        if(!shops){
                return res.status(404).json({
                message: "Shop not found"
            });
        }

        return res.status(200).json(shops)

        } catch (error) {
            return res.status(500).json({
                message: `get my shop error ${error}`})
        }
    }

export const getShopBYCity = async (req, res) => {
    try {
        const { city } = req.params;

        const shops = await Shop.find({
            city: { $regex: new RegExp(`^${city}$`, "i") },
        })
        .populate({
        path: "items",
        populate: {
            path: "shop",
            select: "name isOpen"
        }
    });

        const filteredShops = shops.map(shop => {
            const shopObj = shop.toObject();

            if (!shopObj.isOpen) {
                shopObj.items = []; 
            }

            return shopObj;
        });


        if (shops.length === 0) {
            return res.status(404).json({
                message: "shop not found"
            });
        }

        return res.status(200).json(shops);

    } catch (error) {
        return res.status(500).json({
            message: `get shop by city error ${error.message}`
        });
    }
};

export const toggleShopStatus = async (req, res) => {
    try {
        const shop = await Shop.findOne({ owner: req.userId });

        if (!shop) {
            return res.status(404).json({
                message: "Shop not found"
            });
        }

        shop.isOpen = !shop.isOpen;

        await shop.save();

        const io = req.app.get("io");
        
        io.emit(EVENTS.SHOP_STATUS_CHANGED, {
            shopId: shop._id,
            isOpen: shop.isOpen
        });

        return res.status(200).json({
            message: shop.isOpen
                ? "Shop opened successfully"
                : "Shop closed successfully",
            shop
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};
