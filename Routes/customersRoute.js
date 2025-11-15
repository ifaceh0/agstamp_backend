// import express from 'express';

// import { contactUSController, getAllUserOrder,
//     getCategories, getUserInfo,
//     getWaveImg, subscribeMailService,
//     userLogin, userLogout, userProduct,
//     userRegister, getCustomerShippingPrices
//     } from '../Controller/userController.js';
// import { authorization } from '../Utils/Athorization.js';
// import { addToCart, getCart,
//      removeAllCartItem, removeCartItem, 
//      updateCartItemQuantity
//      } from '../Controller/CartController.js';

// export const customersRoute = express.Router();

// // User registration route
// customersRoute.post('/user/register', userRegister);
// customersRoute.post('/user/login', userLogin);
// customersRoute.get('/user/allproducts', userProduct);
// customersRoute.get('/user/allcategories', getCategories);
// customersRoute.get('/user/waveimg', getWaveImg);
// customersRoute.post('/user/contact/us', contactUSController);



// //login required
// customersRoute.get('/user/info',authorization, getUserInfo);
// customersRoute.get('/user/logout', authorization, userLogout);
// customersRoute.get('/user/getcartitem', authorization, getCart);
// customersRoute.post('/user/cartmanagment',authorization, addToCart);
// customersRoute.post('/user/updatecart',authorization, updateCartItemQuantity);
// customersRoute.get('/user/orders', authorization, getAllUserOrder);
// customersRoute.get('/user/removeitem/:stampId',authorization, removeCartItem);
// customersRoute.get('/user/removeAllitem/:id',authorization, removeAllCartItem);
// customersRoute.post('/user/subscribeMailService',authorization, subscribeMailService);
// // Fetch shipping prices for checkout
// customersRoute.get("/user/shipping-prices", getCustomerShippingPrices);

// import express from 'express';
// import { contactUSController, getAllUserOrder,
//     getCategories, getUserInfo,
//     getWaveImg, subscribeMailService,
//     userLogin, userLogout, userProduct,
//     userRegister, getCustomerShippingPrices
//     } from '../Controller/userController.js';
// import { authorization } from '../Utils/Authorization.js'; // ✅ FIXED: Correct spelling
// import { addToCart, getCart,
//      removeAllCartItem, removeCartItem, 
//      updateCartItemQuantity
//      } from '../Controller/CartController.js';

// export const customersRoute = express.Router();

// // ✅ Public Routes (No auth required)
// customersRoute.post('/user/register', userRegister);
// customersRoute.post('/user/login', userLogin);
// customersRoute.get('/user/allproducts', userProduct);
// customersRoute.get('/user/allcategories', getCategories);
// customersRoute.get('/user/waveimg', getWaveImg);
// customersRoute.post('/user/contact/us', contactUSController);
// customersRoute.get('/user/shipping-prices', getCustomerShippingPrices);

// // ✅ Protected Routes (Auth required)
// customersRoute.get('/user/info', authorization, getUserInfo);
// customersRoute.post('/user/logout', authorization, userLogout); // ✅ FIXED: Changed to POST
// customersRoute.get('/user/getcartitem', authorization, getCart);
// customersRoute.post('/user/cartmanagment', authorization, addToCart);
// customersRoute.post('/user/updatecart', authorization, updateCartItemQuantity);
// customersRoute.get('/user/orders', authorization, getAllUserOrder);
// customersRoute.delete('/user/removeitem/:stampId', authorization, removeCartItem); // ✅ FIXED: Changed to DELETE
// customersRoute.delete('/user/removeAllitem/:id', authorization, removeAllCartItem); // ✅ FIXED: Changed to DELETE
// customersRoute.post('/user/subscribeMailService', authorization, subscribeMailService);
// customersRoute.get('/user/product/:stampId', getSingleStampDetails); // ✅ NEW: Route to get single product details without auth

import express from 'express';
import { contactUSController, getAllUserOrder,
    getCategories, getUserInfo,
    getWaveImg, subscribeMailService,
    userLogin, userLogout, userProduct,
    userRegister, getCustomerShippingPrices,
    getSingleStamp, getPublicCarousels // ✅ NEW: Import the new controller
    } from '../Controller/userController.js';
import { authorization } from '../Utils/Authorization.js';
import { addToCart, getCart,
     removeAllCartItem, removeCartItem, 
     updateCartItemQuantity
     } from '../Controller/CartController.js';

export const customersRoute = express.Router();

// ✅ Public Routes (No auth required)
customersRoute.post('/user/register', userRegister);
customersRoute.post('/user/login', userLogin);
customersRoute.get('/user/allproducts', userProduct);
customersRoute.get('/user/product/:stampId', getSingleStamp); // ✅ NEW: Get single stamp
customersRoute.get('/user/allcategories', getCategories);
customersRoute.get('/user/waveimg', getWaveImg);
customersRoute.get('/user/carousels', getPublicCarousels); 
customersRoute.post('/user/contact/us', contactUSController);
customersRoute.get('/user/shipping-prices', getCustomerShippingPrices);

// ✅ Protected Routes (Auth required)
customersRoute.get('/user/info', authorization, getUserInfo);
customersRoute.post('/user/logout', authorization, userLogout);
customersRoute.get('/user/getcartitem', authorization, getCart);
customersRoute.post('/user/cartmanagment', authorization, addToCart);
customersRoute.post('/user/updatecart', authorization, updateCartItemQuantity);
customersRoute.get('/user/orders', authorization, getAllUserOrder);
customersRoute.delete('/user/removeitem/:stampId', authorization, removeCartItem);
customersRoute.delete('/user/removeAllitem/:id', authorization, removeAllCartItem);
customersRoute.post('/user/subscribeMailService', authorization, subscribeMailService);