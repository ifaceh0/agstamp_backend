import stampModel from "../Model/stampModel.js";
import { ErrorHandler } from "../Utils/ErrorHandler.js";

export const calculateTotal = async (items) => {
    let total = 0;
    for (const item of items) {
      const stamp = await stampModel.findById(item.stamp);
      if (stamp) {
        total += stamp.price * item.quantity;
      }
    }
    return total;
  };

export async function updateStampStock(order) {
  try {
    for (const item of order.items) {
      // Find the stamp by name and category
      const stamp = await stampModel.findOneAndUpdate(
        { 
          name: item.name,
          categories: item.category 
        },
        { $inc: { stock: -item.quantity } },
        { new: true } 
      );

      if (!stamp) {
        return(`Stamp not found: ${item.name} in category ${item.category}`);
      }
    }
    return await stampModel.find();
  } catch (error) {
     throw new ErrorHandler(400,'Error while updating stamp stock')
  }
}

export async function checkStockAvailability(items) {
  try {
    for (const item of items) {
      // Find the stamp by MongoDB ID
      const stamp = await stampModel.findById(item.mongoID);

      // If stamp not found
      if (!stamp) {
        return "stamp not found";
      }

      // Check stock availability
      if (stamp.stock < item.quantity) {
          return `Insufficient stock for ${stamp.name}. Available: ${stamp.stock}, Ordered: ${item.quantity}`
      }
    }
    return true;
  } catch (error) {
    throw new ErrorHandler(500, "Error while checking stock availability");
  }
}

const monthMap = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const categories = [
  "Russia 1858-1918",
  "Russia 1919-1941",
  "Russia 1941-2000",
  "Russia Airmails",
  "Russia Semi-postal",
];

export function summarizeOrdersByMonth(orders) {
  const summary = {};

  orders.forEach(order => {
    const date = new Date(order.dateOfSale);
    const month = monthMap[date.getMonth()];

    if (!summary[month]) {
      // Initialize category revenue + quantity
      summary[month] = {
        month,
        quantity: 0,
      };
      categories.forEach(cat => {
        summary[month][cat] = 0;
      });
    }

    order.items.forEach(item => {
      const category = item.category;
      const revenue = item.totalPrice;
      const quantity = item.quantity;

      if (categories.includes(category)) {
        summary[month][category] += revenue;
      }

      summary[month].quantity += quantity;
    });
  });

  return Object.values(summary);
}


export function getMonthlyPurchasers(orders) {
  const monthlyPurchasers = {};

  orders.forEach(order => {
    const date = new Date(order.dateOfSale);
    const month = monthMap[date.getMonth()];
    const userId = order.userId;

    if (!monthlyPurchasers[month]) {
      monthlyPurchasers[month] = new Set();
    }

    if (userId) {
      monthlyPurchasers[month].add(userId.toString());
    }
  });

  // Convert to desired output format
  const userData = monthMap.map(month => ({
    month,
    Purchasers: monthlyPurchasers[month]?.size || 0
  }));

  return userData;
}


export function getTopStampsThisMonth(orders) {
  const currentMonth = new Date().getMonth(); // 0-based: Jan = 0
  const stampMap = new Map();

  for (const order of orders) {
    const orderMonth = new Date(order.dateOfSale).getMonth();
    if (orderMonth !== currentMonth) continue;

    for (const item of order.items) {
      const key = item.name;
      const existing = stampMap.get(key);

      if (existing) {
        existing.unitsSold += item.quantity;
      } else {
        stampMap.set(key, {
          id: item._id,
          name: item.name,
          image: item.image?.publicUrl || "https://via.placeholder.com/100",
          unitsSold: item.quantity,
        });
      }
    }
  }

  // Convert map to array and sort by unitsSold descending
  const popularStamps = [...stampMap.values()]
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 6);

  return popularStamps;
}
