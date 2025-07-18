const { sql } = require('../models/db');

exports.admin_dashboard = async(req,res,next) => {
    try{
        const userdetails = await sql`
            SELECT 
                COUNT(email) AS total_users,
                COUNT(CASE WHEN role = 'premium' THEN 1 END) AS premium_users,
                SUM(active_alerts) AS active_alerts
            FROM signup
        `;
        const productdetails = await sql`
            select 
                COUNT(CASE WHEN product_discount>0 THEN 1 END) AS positive_discount,
                COUNT(CASE WHEN product_discount<0 THEN 1 END) as negetive_Discount,
                COUNT(product_name) as total_products
            from products_data
        `;
        return res.json({
            userdetails: userdetails[0],
            productdetails: productdetails[0]});
    }
    catch(error){
        return res.status(500).json({ message: "Server error" });
    };
};

exports.admin_all_users_details = async(req,res,next) => {
    try{
        const userdetails = await sql`
            select * from signup
        `;
        return res.json({
            userdetails: userdetails
        });
    }
    catch(error){
        return res.status(500).json({ message: "Server error" });
    }
}

exports.admin_products_view = async(req,res,next) =>{
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    try{
        const response = await sql`
        SELECT *
        FROM products_data
        LIMIT ${limit}
        OFFSET ${offset}
        `;
        return res.status(200).json({
            products: response
        });
    }
    catch(error){
        return res.status(500).json({ message: "Server error" });
    }
}

exports.admin_product_update = async (req, res, next) => {
  try {
    const { product_id } = req.params;
    const {
      product_name,
      product_price,
      product_image,
      product_discount,
      product_max_price,
      users_tracked,
      product_url
    } = req.body;

    await sql`
      UPDATE products_data
      SET 
        product_name = ${product_name},
        product_price = ${product_price},
        product_image = ${product_image},
        product_discount = ${product_discount},
        product_max_price = ${product_max_price},
        users_tracked = ${users_tracked},
        product_url = ${product_url}
      WHERE product_id = ${product_id}
    `;

    return res.json({ message: "success" });
  } 
  catch (error) {
    console.error("Admin product update error:", error);
    return res.status(500).json({ message: "Server error" });
  };
};

exports.admin_product_delete = async(req,res,next) =>{
    try{
        const {product_id} = req.params;
        await sql`BEGIN`;
            await sql`
                UPDATE signup
                SET products_tracking = products_tracking - 1
                WHERE email IN (
                    SELECT email FROM user_urls WHERE product_id = ${product_id})
            `;
            await sql`
                DELETE 
                FROM products_data
                WHERE product_id = ${product_id}
            `;
            await sql`
                DELETE
                FROM user_urls
                WHERE product_id = ${product_id}
            `;
            await sql`
                DELETE
                FROM product_price_history
                WHERE product_id = ${product_id}
            `;
            await sql`
                DELETE
                FROM product_ids
                WHERE product_id = ${product_id}
            `;
        await sql`COMMIT`;
        
        return res.status(200).json({message:"SUCCESS"});
    }
    catch(error){
        await sql`ROLLBACK`;
        return res.status(500).json({ message:"Server error" });
    };
};

exports.admin_user_update = async(req,res,next) =>{
    try{
        const {email} = req.params;
        const {name,phone_number,product_tracking,role,active_alerts,billing,signup_date} = req.body;
        await sql`
            UPDATE signup
            SET 
                name = ${name},
                phone_number = ${phone_number},
                product_tracking = ${product_tracking},
                role = ${role},
                active_alerts = ${active_alerts},
                billing = ${billing},
                signup_date = ${signup_date}
            WHERE email = ${email}
        `;
        return res.status(200).json({message:"SUCCESS"});

    }
    catch(error){
        return res.status(500).json({ message:"Server error" });
    }
}