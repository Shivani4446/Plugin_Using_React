<?php
/**
 * Plugin Name: Product Notices React
 * Description: A plugin to manage product notices using React.
 * Version: 1.0.0
 * Author: Shivani Sank
 */

// Add a settings page to the WordPress admin.
function product_notices_react_settings_page() {
    add_options_page(
        __( 'Product Notices', 'product-notices-react' ),
        __( 'Product Notices', 'product-notices-react' ),
        'manage_options',
        'product-notices-react',
        'product_notices_react_settings_page_html'
    );
}
add_action( 'admin_menu', 'product_notices_react_settings_page' );

// Render the settings page HTML.
function product_notices_react_settings_page_html() {
    printf(
        '<div class="wrap" id="product-notices-react-settings">%s</div>',
        esc_html__( 'Loading…', 'product-notices-react' )
    );
}

// Enqueue React and your custom scripts.
function product_notices_react_enqueue_scripts( $admin_page ) {
    if ( 'settings_page_product-notices-react' !== $admin_page ) {
        return;
    }

    $asset_file = plugin_dir_path( __FILE__ ) . 'build/index.asset.php';

    if ( ! file_exists( $asset_file ) ) {
        return;
    }

    $asset = include $asset_file;

    wp_enqueue_script(
        'product-notices-react-script',
        plugins_url( 'build/index.js', __FILE__ ),
        $asset['dependencies'],
        $asset['version'],
        true // Load in footer
    );
}
add_action( 'admin_enqueue_scripts', 'product_notices_react_enqueue_scripts' );

// Function to display product notices on the frontend.
function display_product_notices() {
    if ( ! is_product() ) {
        return;
    }

    $notices = get_option('product_notices', array());
    $user_id = get_current_user_id();

    if ( ! empty($notices[$user_id]) ) {
        $notice = esc_html($notices[$user_id]);
        $bgColor = esc_html($notices["{$user_id}_color"] ?? '#a0b8c3');
        $textColor = esc_html($notices["{$user_id}_textColor"] ?? '#ffffff');
        $fontSize = esc_html($notices["{$user_id}_fontSize"] ?? '16px'); // Default font size

        echo sprintf(
            '<div style="background: %s; color: %s; padding: 1rem; font-size: %s; margin:15px; border-radius: %dpx;">%s</div>',
            $bgColor,
            $textColor,
            $fontSize, // Use the saved font size here
            $notices["{$user_id}_borderRadius"] ?? 5,
            $notice
        );
    }
}
add_action('woocommerce_single_product_summary', 'display_product_notices', 25);

// Create a settings link for your plugin.
function product_notices_react_settings_link( $links ) {
    $settings_link = '<a href="options-general.php?page=product-notices-react">' . __( 'Settings', 'product-notices-react' ) . '</a>';
    array_push( $links, $settings_link );
    return $links;
}
add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), 'product_notices_react_settings_link' );

// Register REST API endpoint
function product_notices_register_api() {
    register_rest_route('product-notices/v1', '/save/', array(
        'methods' => 'POST',
        'callback' => 'product_notices_save',
        'permission_callback' => function() {
            return current_user_can('manage_options'); // Adjust permissions as necessary
        },
    ));
}
add_action('rest_api_init', 'product_notices_register_api');

// Handle the POST request to save product notices
function product_notices_save(WP_REST_Request $request) {
    $user_id = get_current_user_id();
    $notice = sanitize_text_field($request->get_param('notice'));
    $bgColor = sanitize_hex_color($request->get_param('bgColor'));
    $textColor = sanitize_hex_color($request->get_param('textColor'));
    $borderRadius = intval($request->get_param('borderRadius'));
    $fontSize = sanitize_text_field($request->get_param('fontSize')); // Capture font size
    $category = sanitize_text_field($request->get_param('category'));
    $productId = intval($request->get_param('productId')); 

    if (empty($notice)) {
        return new WP_Error('no_notice', 'No notice provided', array('status' => 400));
    }

    $notices = get_option('product_notices', array());

    // Update notice, colors, and font size for the current user
    $notices[$user_id] = $notice;
    $notices["{$user_id}_color"] = $bgColor; 
    $notices["{$user_id}_textColor"] = $textColor; 
    $notices["{$user_id}_borderRadius"] = $borderRadius;
    $notices["{$user_id}_fontSize"] = $fontSize; // Save the font size
    $notices["{$user_id}_category"] = $category;
    $notices["{$user_id}_productId"] = $productId;

    update_option('product_notices', $notices);

    return new WP_REST_Response('Notice saved successfully', 200);
}












add_action('rest_api_init', function () {
    register_rest_route('product-notices/v1', '/get-product-categories', array(
        'methods' => 'GET',
        'callback' => 'get_product_notice_product_categories',
        'permission_callback' => function () {
            return current_user_can('edit_posts');
        }
    ));
});

function get_product_notice_product_categories() {
    global $wpdb;
    
    $query = "
    SELECT 
        t.term_id,
        t.name AS category_name,
        COUNT(DISTINCT p.ID) as product_count
    FROM 
        {$wpdb->posts} p
    JOIN 
        {$wpdb->term_relationships} tr ON p.ID = tr.object_id
    JOIN 
        {$wpdb->term_taxonomy} tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
    JOIN 
        {$wpdb->terms} t ON tt.term_id = t.term_id
    WHERE 
        p.post_type = 'product'
        AND tt.taxonomy = 'product_cat'
    GROUP BY 
        t.term_id, t.name, t.slug
    ORDER BY 
        t.name ASC
    ";
    
    $categories = $wpdb->get_results($query);
    
    if (empty($categories)) {
        return new WP_Error('no_categories', 'No product categories found', array('status' => 404));
    }
    
    return array_map(function($category) {
        return array(
            'term_id' => (int)$category->term_id,
            'name' => $category->category_name,
            'count' => (int)$category->product_count
        );
    }, $categories);
}






function register_product_data_endpoint() {
    register_rest_route('product-notices/v1', '/get-products', array(
        'methods' => 'GET',
        'callback' => 'get_product_data',
        'permission_callback' => function() {
            return current_user_can('edit_posts');
        }
    ));
}
add_action('rest_api_init', 'register_product_data_endpoint');


function get_product_data() {
    global $wpdb;
    
    $query = "
    SELECT 
        p.ID as id,
        p.post_title,
        p.post_type
    FROM 
        {$wpdb->posts} p
    WHERE 
        p.post_type = 'product'
    ORDER BY 
        p.post_title ASC
    ";

    $products = $wpdb->get_results($query); // Fetch the products

    if (empty($products)) {
        return new WP_Error('no_products', 'No products found', array('status' => 404));
    }

    return array_map(function($product) {
        return array(
            'id' => (int)$product->id,
            'title' => $product->post_title, // Correctly reference post_title
            'type' => (string)$product->post_type // Ensure post_type is a string
        );
    }, $products);
}





remove_action('wp_headers', 'wp_headers');

function allow_iframe() {
    header('X-Frame-Options:ALLOW-FROM http://localhost:10005');
}
add_action('send_headers', 'allow_iframe');
