// import express from 'express';
// import { authorization } from '../Utils/Athorization.js';
// import { createCarousel, createStamp,
//     deleteCarousel, deleteStamp, updateCarousel
//     } from '../Controller/FileUploadController.js';
// import { Protected } from '../Utils/Protected.js';
// import { 
//     addCategory, allCarousel, allStamps, 
//     dashboardData, editOrder, getAllContactus,
//     getAllOrders, getAllSubscriber, sendMailToSubscribers,
//     singleCarousel, singleStamp, updateStamp,
//     getAllCategories, updateCategory, deleteCategory
//     } from '../Controller/AdminController.js';
// import { getShippingRates, updateShippingRate } from '../Controller/AdminController.js';
// import { addCountry, updateCountry, deleteCountry, getCountries } from '../Controller/AdminController.js';


// export const adminRoute = express.Router();


// adminRoute.post('/admin/addStamp',authorization,Protected,createStamp);
// adminRoute.post('/admin/addcategories',authorization,Protected,addCategory);
// adminRoute.get("/admin/getcategories", authorization, Protected, getAllCategories);

// // ✅ New category routes
// adminRoute.put('/admin/updatecategory/:id', authorization, Protected, updateCategory);
// adminRoute.delete('/admin/deletecategory/:id', authorization, Protected, deleteCategory);

// adminRoute.get('/admin/getallstamp',authorization,Protected,allStamps);
// // adminRoute.post('/admin/waveimg',authorization,Protected,uploadPhoto);
// adminRoute.get('/admin/getallsubscribers',authorization,Protected,getAllSubscriber);
// adminRoute.post('/admin/sendmailtosubscribers',authorization,Protected,sendMailToSubscribers);
// adminRoute.get('/admin/usersallorders',authorization,Protected,getAllOrders);
// adminRoute.patch('/admin/updateOrder',authorization,Protected,editOrder);
// adminRoute.get('/admin/dashBoardData',authorization,Protected,dashboardData);
// adminRoute.get('/admin/all/feedback',authorization,Protected,getAllContactus);


// // CarouselModel
// adminRoute.post('/admin/addcarousel',authorization,Protected,createCarousel);
// adminRoute.get('/admin/getallcarousel',allCarousel);

// //dynamic routes
// adminRoute.delete('/admin/deletecarousel/:id',authorization,Protected,deleteCarousel);
// adminRoute.get('/admin/carousel/:id',authorization,Protected,singleCarousel);
// adminRoute.put('/admin/updatecarousel/:id',authorization,Protected,updateCarousel);
// adminRoute.delete('/admin/deleteStamp/:id',authorization,Protected,deleteStamp);
// adminRoute.get('/admin/getstamp/:id',singleStamp);
// adminRoute.put('/admin/updateStamp/:id',authorization,Protected,updateStamp);

// // Get all shipping rates (admin view)
// adminRoute.get('/admin/shipping-rates', authorization, Protected, getShippingRates);

// // Update or create a shipping rate (admin update)
// adminRoute.put('/admin/shipping-rates', authorization, Protected, updateShippingRate);

// // Admin protected
// adminRoute.post('/admin/countries', authorization, Protected, addCountry);
// adminRoute.put('/admin/countries/:id', authorization, Protected, updateCountry);
// adminRoute.delete('/admin/countries/:id', authorization, Protected, deleteCountry);

// // Public or authenticated (for the cart)
// adminRoute.get('/admin/countries', getCountries); // no admin middleware so frontend can call it

import express from 'express';
import { authorization } from '../Utils/Authorization.js'; // ✅ FIXED: Correct spelling
import { createCarousel, createStamp,
    deleteCarousel, deleteStamp, updateCarousel
    } from '../Controller/FileUploadController.js';
import { Protected } from '../Utils/Protected.js';
import { 
    addCategory, allCarousel, allStamps, 
    dashboardData, editOrder, getAllContactus,
    getAllOrders, getAllSubscriber, sendMailToSubscribers,
    singleCarousel, singleStamp, updateStamp,
    getAllCategories, updateCategory, deleteCategory,
    getShippingRates, updateShippingRate,
    addCountry, updateCountry, deleteCountry, getCountries
    } from '../Controller/AdminController.js';

export const adminRoute = express.Router();

// ✅ Stamp Routes
adminRoute.post('/admin/addStamp', authorization, Protected, createStamp);
adminRoute.get('/admin/getallstamp', authorization, Protected, allStamps);
adminRoute.get('/admin/getstamp/:id', authorization, Protected, singleStamp); // ✅ FIXED: Added auth
adminRoute.put('/admin/updateStamp/:id', authorization, Protected, updateStamp);
adminRoute.delete('/admin/deleteStamp/:id', authorization, Protected, deleteStamp);

// ✅ Category Routes
adminRoute.post('/admin/addcategories', authorization, Protected, addCategory);
adminRoute.get('/admin/getcategories', authorization, Protected, getAllCategories);
adminRoute.put('/admin/updatecategory/:id', authorization, Protected, updateCategory);
adminRoute.delete('/admin/deletecategory/:id', authorization, Protected, deleteCategory);

// ✅ Carousel Routes
adminRoute.post('/admin/addcarousel', authorization, Protected, createCarousel);
adminRoute.get('/admin/getallcarousel', authorization, Protected, allCarousel); // ✅ FIXED: Added auth
adminRoute.get('/admin/carousel/:id', authorization, Protected, singleCarousel);
adminRoute.put('/admin/updatecarousel/:id', authorization, Protected, updateCarousel);
adminRoute.delete('/admin/deletecarousel/:id', authorization, Protected, deleteCarousel);

// ✅ Subscriber Routes
adminRoute.get('/admin/getallsubscribers', authorization, Protected, getAllSubscriber);
adminRoute.post('/admin/sendmailtosubscribers', authorization, Protected, sendMailToSubscribers);

// ✅ Order Routes
adminRoute.get('/admin/usersallorders', authorization, Protected, getAllOrders);
adminRoute.patch('/admin/updateOrder', authorization, Protected, editOrder);

// ✅ Dashboard & Feedback
adminRoute.get('/admin/dashBoardData', authorization, Protected, dashboardData);
adminRoute.get('/admin/all/feedback', authorization, Protected, getAllContactus);

// ✅ Shipping Rates - CRITICAL FIX: Support BOTH PUT and PATCH
adminRoute.get('/admin/shipping-rates', authorization, Protected, getShippingRates);
adminRoute.put('/admin/shipping-rates', authorization, Protected, updateShippingRate);
adminRoute.patch('/admin/shipping-rates', authorization, Protected, updateShippingRate); // ✅ Added PATCH support

// ✅ Country Routes
adminRoute.post('/admin/countries', authorization, Protected, addCountry);
adminRoute.put('/admin/countries/:id', authorization, Protected, updateCountry);
adminRoute.delete('/admin/countries/:id', authorization, Protected, deleteCountry);
adminRoute.get('/admin/countries', getCountries); // Public - no auth needed