import express from 'express';
import { authorization } from '../Utils/Athorization.js';
import { createCarousel, createStamp,
    deleteCarousel, deleteStamp, updateCarousel
    } from '../Controller/FileUploadController.js';
import { Protected } from '../Utils/Protected.js';
import { 
    addCategory, allCarousel, allStamps, 
    dashboardData, editOrder, getAllContactus,
    getAllOrders, getAllSubscriber, sendMailToSubscribers,
    singleCarousel, singleStamp, updateStamp,
    getAllCategories, updateCategory, deleteCategory
    } from '../Controller/AdminController.js';
import { getShippingRates, updateShippingRate } from '../Controller/AdminController.js';
import { addCountry, updateCountry, deleteCountry, getCountries } from '../Controller/AdminController.js';


export const adminRoute = express.Router();


adminRoute.post('/admin/addStamp',authorization,Protected,createStamp);
adminRoute.post('/admin/addcategories',authorization,Protected,addCategory);
adminRoute.get("/admin/getcategories", authorization, Protected, getAllCategories);

// ✅ New category routes
adminRoute.put('/admin/updatecategory/:id', authorization, Protected, updateCategory);
adminRoute.delete('/admin/deletecategory/:id', authorization, Protected, deleteCategory);

adminRoute.get('/admin/getallstamp',authorization,Protected,allStamps);
// adminRoute.post('/admin/waveimg',authorization,Protected,uploadPhoto);
adminRoute.get('/admin/getallsubscribers',authorization,Protected,getAllSubscriber);
adminRoute.post('/admin/sendmailtosubscribers',authorization,Protected,sendMailToSubscribers);
adminRoute.get('/admin/usersallorders',authorization,Protected,getAllOrders);
adminRoute.patch('/admin/updateOrder',authorization,Protected,editOrder);
adminRoute.get('/admin/dashBoardData',authorization,Protected,dashboardData);
adminRoute.get('/admin/all/feedback',authorization,Protected,getAllContactus);


// CarouselModel
adminRoute.post('/admin/addcarousel',authorization,Protected,createCarousel);
adminRoute.get('/admin/getallcarousel',allCarousel);

//dynamic routes
adminRoute.delete('/admin/deletecarousel/:id',authorization,Protected,deleteCarousel);
adminRoute.get('/admin/carousel/:id',authorization,Protected,singleCarousel);
adminRoute.put('/admin/updatecarousel/:id',authorization,Protected,updateCarousel);
adminRoute.delete('/admin/deleteStamp/:id',authorization,Protected,deleteStamp);
adminRoute.get('/admin/getstamp/:id',singleStamp);
adminRoute.put('/admin/updateStamp/:id',authorization,Protected,updateStamp);

// Get all shipping rates (admin view)
adminRoute.get('/admin/shipping-rates', authorization, Protected, getShippingRates);

// Update or create a shipping rate (admin update)
adminRoute.put('/admin/shipping-rates', authorization, Protected, updateShippingRate);

// Admin protected
adminRoute.post('/admin/countries', authorization, Protected, addCountry);
adminRoute.put('/admin/countries/:id', authorization, Protected, updateCountry);
adminRoute.delete('/admin/countries/:id', authorization, Protected, deleteCountry);

// Public or authenticated (for the cart)
adminRoute.get('/countries', getCountries); // no admin middleware so frontend can call it