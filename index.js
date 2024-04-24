const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Read menu from menu.json file
const menuPath = './menu.json';

function readMenuFromFile(callback) {
  fs.readFile(menuPath, (err, data) => {
    if (err) {
      console.error('Error reading menu:', err);
      callback([]);
    } else {
      try {
        const menu = JSON.parse(data);
        callback(menu);
      } catch (parseErr) {
        console.error('Error parsing menu JSON:', parseErr);
        callback([]);
      }
    }
  });
}

// Read users from user.json file
const userPath = './user.json';

function readUsersFromFile(callback) {
  fs.readFile(userPath, (err, data) => {
    if (err) {
      console.error('Error reading users:', err);
      callback([]);
    } else {
      try {
        const users = JSON.parse(data);
        callback(users);
      } catch (parseErr) {
        console.error('Error parsing user JSON:', parseErr);
        callback([]);
      }
    }
  });
}

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to the Canteen App!');
});

app.get('/menu', (req, res) => {
  readMenuFromFile(menu => {
    res.json(menu);
  })
})

// Route for user login
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  readUsersFromFile(users => {
    const foundUser = users.find(user => user.username === username && user.password === password);
    if (foundUser) {
      res.send({ message: 'Login successful!', userName: foundUser.username, userId: foundUser.userId });
    } else {
      res.status(401).send({ message:'Invalid username or password'});
    }
  });
});

// Route for placing orders
app.post('/placeOrder', (req, res) => {
  const { userId, items } = req.body;
    
    // Load existing orders from ordered.json
    fs.readFile('ordered.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading ordered.json:', err);
            return res.status(500).send('Internal Server Error');
        }

        let orders = [];
        if (data) {
            try {
                orders = JSON.parse(data);
            } catch (parseErr) {
                console.error('Error parsing ordered.json:', parseErr);
                return res.status(500).send('Internal Server Error');
            }
        }
        
        // Create a new order object
        const newOrder = {
            userId: userId,
            timestamp: new Date().toISOString(),
            items: items
        };

        // Append the new order to the orders list
        orders.push(newOrder);

        // Write the updated orders list back to ordered.json
        fs.writeFile('ordered.json', JSON.stringify(orders, null, 2), err => {
            if (err) {
                console.error('Error writing ordered.json:', err);
                return res.status(500).send({ message:'Internal Server Error'});
            }
            console.log('Order placed successfully:', newOrder);
            res.send({ message:'Order placed successfully!'});
        });
    });
});

// Route to get menu item details by ID
app.get('/menu/:id', (req, res) => {
  const itemId = parseInt(req.params.id);
  
  // Read menu from menu.json file
  fs.readFile(menuPath, (err, data) => {
      if (err) {
          console.error('Error reading menu:', err);
          return res.status(500).json({ error: 'Internal Server Error' });
      }

      try {
          const menu = JSON.parse(data);
          
          // Find the item with the specified ID
          const menuItem = menu.find(item => item.id === itemId);
          
          if (!menuItem) {
              return res.status(404).json({ error: 'Menu item not found' });
          }

          res.json(menuItem);
      } catch (parseErr) {
          console.error('Error parsing menu JSON:', parseErr);
          res.status(500).json({ error: 'Internal Server Error' });
      }
  });
});

// Route to get order history for a user
app.get('/order-history/:userId', (req, res) => {
  const userId = req.params.userId;
  
  // Read orders from ordered.json file
  fs.readFile('ordered.json', 'utf8', (err, data) => {
      if (err) {
          console.error('Error reading ordered.json:', err);
          return res.status(500).json({ error: 'Internal Server Error' });
      }

      let orders = [];
      if (data) {
          try {
              orders = JSON.parse(data);
          } catch (parseErr) {
              console.error('Error parsing ordered.json:', parseErr);
              return res.status(500).json({ error: 'Internal Server Error' });
          }
      }
      
      // Filter orders by user ID
      const userOrders = orders.filter(order => order.userId.toString() === userId);
      
      // Return the filtered orders
      if (userOrders.length > 0) {
          res.json(userOrders);
      } else {
          res.status(404).json({ error: 'No orders found for this user' });
      }
  });
});




// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});