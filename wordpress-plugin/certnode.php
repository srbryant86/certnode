<?php
/**
 * Plugin Name: CertNode T17+ Content Certification
 * Plugin URI: https://certnode.io/wordpress-plugin
 * Description: Institutional-grade content certification integration for WordPress. Certify your content through CertNode's T17+ Logic Governance Infrastructure with enterprise security and compliance features.
 * Version: 1.0.0
 * Author: CertNode
 * Author URI: https://certnode.io
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: certnode
 * Domain Path: /languages
 * Requires at least: 5.0
 * Tested up to: 6.4
 * Requires PHP: 7.4
 * Network: false
 * 
 * @package CertNode
 * @version 1.0.0
 * @author CertNode
 * @copyright 2024 CertNode
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit('Direct access denied.');
}

// Define plugin constants
define('CERTNODE_VERSION', '1.0.0');
define('CERTNODE_PLUGIN_URL', plugin_dir_url(__FILE__));
define('CERTNODE_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('CERTNODE_API_BASE', 'https://api.certnode.io');
define('CERTNODE_MIN_PHP_VERSION', '7.4');
define('CERTNODE_MIN_WP_VERSION', '5.0');

/**
 * Main CertNode Plugin Class
 * 
 * Handles all plugin functionality including API integration,
 * content certification, and WordPress admin interface.
 */
class CertNodePlugin
{
    /**
     * Single instance of the plugin
     * @var CertNodePlugin
     */
    private static $instance = null;
    
    /**
     * Plugin options
     * @var array
     */
    private $options = [];
    
    /**
     * API service instance
     * @var CertNodeAPIService
     */
    private $api_service;
    
    /**
     * Database manager instance
     * @var CertNodeDatabase
     */
    private $database;
    
    /**
     * Get singleton instance
     * 
     * @return CertNodePlugin
     */
    public static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Constructor - Initialize plugin
     */
    private function __construct()
    {
        $this->checkRequirements();
        $this->loadOptions();
        $this->initializeServices();
        $this->registerHooks();
    }
    
    /**
     * Check system requirements
     */
    private function checkRequirements()
    {
        if (version_compare(PHP_VERSION, CERTNODE_MIN_PHP_VERSION, '<')) {
            add_action('admin_notices', function() {
                echo '<div class="notice notice-error"><p>';
                echo sprintf(
                    __('CertNode T17+ requires PHP %s or higher. Current version: %s', 'certnode'),
                    CERTNODE_MIN_PHP_VERSION,
                    PHP_VERSION
                );
                echo '</p></div>';
            });
            return;
        }
        
        if (version_compare(get_bloginfo('version'), CERTNODE_MIN_WP_VERSION, '<')) {
            add_action('admin_notices', function() {
                echo '<div class="notice notice-error"><p>';
                echo sprintf(
                    __('CertNode T17+ requires WordPress %s or higher. Current version: %s', 'certnode'),
                    CERTNODE_MIN_WP_VERSION,
                    get_bloginfo('version')
                );
                echo '</p></div>';
            });
            return;
        }
    }
    
    /**
     * Load plugin options
     */
    private function loadOptions()
    {
        $this->options = get_option('certnode_options', [
            'api_key' => '',
            'api_base' => CERTNODE_API_BASE,
            'auto_certify' => false,
            'show_badge' => true,
            'badge_position' => 'bottom',
            'certification_types' => ['standard'],
            'post_types' => ['post', 'page'],
            'user_roles' => ['administrator', 'editor'],
            'cache_duration' => 3600,
            'webhook_secret' => '',
            'compliance_mode' => false,
            'audit_logging' => true
        ]);
    }
    
    /**
     * Initialize services
     */
    private function initializeServices()
    {
        require_once CERTNODE_PLUGIN_PATH . 'includes/class-certnode-api.php';
        require_once CERTNODE_PLUGIN_PATH . 'includes/class-certnode-database.php';
        require_once CERTNODE_PLUGIN_PATH . 'includes/class-certnode-security.php';
        require_once CERTNODE_PLUGIN_PATH . 'includes/class-certnode-cache.php';
        
        $this->api_service = new CertNodeAPIService($this->options);
        $this->database = new CertNodeDatabase();
    }
    
    /**
     * Register WordPress hooks
     */
    private function registerHooks()
    {
        // Activation/Deactivation hooks
        register_activation_hook(__FILE__, [$this, 'activate']);
        register_deactivation_hook(__FILE__, [$this, 'deactivate']);
        register_uninstall_hook(__FILE__, [__CLASS__, 'uninstall']);
        
        // Core WordPress hooks
        add_action('init', [$this, 'init']);
        add_action('admin_init', [$this, 'admin_init']);
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_enqueue_scripts', [$this, 'admin_enqueue_scripts']);
        add_action('wp_enqueue_scripts', [$this, 'frontend_enqueue_scripts']);
        
        // Post/Page hooks
        add_action('add_meta_boxes', [$this, 'add_meta_boxes']);
        add_action('save_post', [$this, 'save_post_meta'], 10, 2);
        add_action('publish_post', [$this, 'auto_certify_content'], 10, 2);
        add_action('publish_page', [$this, 'auto_certify_content'], 10, 2);
        
        // Content filtering
        add_filter('the_content', [$this, 'add_certification_badge']);
        add_filter('post_class', [$this, 'add_certification_classes']);
        
        // AJAX hooks
        add_action('wp_ajax_certnode_certify', [$this, 'ajax_certify_content']);
        add_action('wp_ajax_certnode_check_status', [$this, 'ajax_check_certification_status']);
        add_action('wp_ajax_certnode_get_stats', [$this, 'ajax_get_statistics']);
        add_action('wp_ajax_certnode_refresh_cache', [$this, 'ajax_refresh_cache']);
        
        // REST API hooks
        add_action('rest_api_init', [$this, 'register_rest_routes']);
        
        // Webhook hooks
        add_action('wp_ajax_nopriv_certnode_webhook', [$this, 'handle_webhook']);
        add_action('wp_ajax_certnode_webhook', [$this, 'handle_webhook']);
        
        // Shortcode registration
        add_shortcode('certnode_badge', [$this, 'certification_badge_shortcode']);
        add_shortcode('certnode_stats', [$this, 'certification_stats_shortcode']);
        
        // Cron hooks
        add_action('certnode_cleanup_expired', [$this, 'cleanup_expired_certifications']);
        add_action('certnode_sync_usage', [$this, 'sync_usage_statistics']);
        
        // Security hooks
        add_action('wp_login', [$this, 'log_user_access'], 10, 2);
        add_action('wp_logout', [$this, 'log_user_logout']);
    }
    
    /**
     * Plugin activation
     */
    public function activate()
    {
        // Create database tables
        $this->database->createTables();
        
        // Set default options
        add_option('certnode_options', $this->options);
        
        // Schedule cron jobs
        if (!wp_next_scheduled('certnode_cleanup_expired')) {
            wp_schedule_event(time(), 'daily', 'certnode_cleanup_expired');
        }
        
        if (!wp_next_scheduled('certnode_sync_usage')) {
            wp_schedule_event(time(), 'hourly', 'certnode_sync_usage');
        }
        
        // Create upload directory
        $upload_dir = wp_upload_dir();
        $certnode_dir = $upload_dir['basedir'] . '/certnode';
        if (!file_exists($certnode_dir)) {
            wp_mkdir_p($certnode_dir);
            file_put_contents($certnode_dir . '/.htaccess', 'deny from all');
        }
        
        // Log activation
        $this->log_event('plugin_activated', [
            'version' => CERTNODE_VERSION,
            'wp_version' => get_bloginfo('version'),
            'php_version' => PHP_VERSION
        ]);
        
        // Flush rewrite rules
        flush_rewrite_rules();
    }
    
    /**
     * Plugin deactivation
     */
    public function deactivate()
    {
        // Clear scheduled cron jobs
        wp_clear_scheduled_hook('certnode_cleanup_expired');
        wp_clear_scheduled_hook('certnode_sync_usage');
        
        // Clear cache
        wp_cache_flush();
        
        // Log deactivation
        $this->log_event('plugin_deactivated', [
            'version' => CERTNODE_VERSION
        ]);
        
        // Flush rewrite rules
        flush_rewrite_rules();
    }
    
    /**
     * Plugin uninstall
     */
    public static function uninstall()
    {
        // Remove options
        delete_option('certnode_options');
        delete_option('certnode_version');
        
        // Remove database tables
        global $wpdb;
        $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}certnode_certifications");
        $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}certnode_audit_log");
        $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}certnode_cache");
        
        // Remove uploaded files
        $upload_dir = wp_upload_dir();
        $certnode_dir = $upload_dir['basedir'] . '/certnode';
        if (file_exists($certnode_dir)) {
            array_map('unlink', glob("$certnode_dir/*"));
            rmdir($certnode_dir);
        }
        
        // Clear all transients
        $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_certnode_%'");
        $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_timeout_certnode_%'");
    }
    
    /**
     * Initialize plugin
     */
    public function init()
    {
        // Load text domain for internationalization
        load_plugin_textdomain('certnode', false, dirname(plugin_basename(__FILE__)) . '/languages');
        
        // Initialize database if needed
        $this->database->checkVersion();
        
        // Register custom post status
        register_post_status('certnode_pending', [
            'label' => __('Certification Pending', 'certnode'),
            'public' => false,
            'exclude_from_search' => false,
            'show_in_admin_all_list' => true,
            'show_in_admin_status_list' => true,
            'label_count' => _n_noop(
                'Certification Pending <span class="count">(%s)</span>',
                'Certification Pending <span class="count">(%s)</span>',
                'certnode'
            ),
        ]);
    }
    
    /**
     * Admin initialization
     */
    public function admin_init()
    {
        // Register settings
        register_setting('certnode_options', 'certnode_options', [
            'sanitize_callback' => [$this, 'sanitize_options']
        ]);
        
        // Add settings sections
        add_settings_section(
            'certnode_api_settings',
            __('API Configuration', 'certnode'),
            [$this, 'api_settings_section_callback'],
            'certnode_settings'
        );
        
        add_settings_section(
            'certnode_content_settings',
            __('Content Settings', 'certnode'),
            [$this, 'content_settings_section_callback'],
            'certnode_settings'
        );
        
        add_settings_section(
            'certnode_display_settings',
            __('Display Settings', 'certnode'),
            [$this, 'display_settings_section_callback'],
            'certnode_settings'
        );
        
        add_settings_section(
            'certnode_security_settings',
            __('Security & Compliance', 'certnode'),
            [$this, 'security_settings_section_callback'],
            'certnode_settings'
        );
        
        // Add settings fields
        $this->add_settings_fields();
    }
    
    /**
     * Add settings fields
     */
    private function add_settings_fields()
    {
        // API Settings
        add_settings_field(
            'api_key',
            __('API Key', 'certnode'),
            [$this, 'api_key_field_callback'],
            'certnode_settings',
            'certnode_api_settings'
        );
        
        add_settings_field(
            'api_base',
            __('API Base URL', 'certnode'),
            [$this, 'api_base_field_callback'],
            'certnode_settings',
            'certnode_api_settings'
        );
        
        // Content Settings
        add_settings_field(
            'auto_certify',
            __('Auto-Certify Content', 'certnode'),
            [$this, 'auto_certify_field_callback'],
            'certnode_settings',
            'certnode_content_settings'
        );
        
        add_settings_field(
            'post_types',
            __('Post Types', 'certnode'),
            [$this, 'post_types_field_callback'],
            'certnode_settings',
            'certnode_content_settings'
        );
        
        add_settings_field(
            'certification_types',
            __('Certification Types', 'certnode'),
            [$this, 'certification_types_field_callback'],
            'certnode_settings',
            'certnode_content_settings'
        );
        
        // Display Settings
        add_settings_field(
            'show_badge',
            __('Show Certification Badge', 'certnode'),
            [$this, 'show_badge_field_callback'],
            'certnode_settings',
            'certnode_display_settings'
        );
        
        add_settings_field(
            'badge_position',
            __('Badge Position', 'certnode'),
            [$this, 'badge_position_field_callback'],
            'certnode_settings',
            'certnode_display_settings'
        );
        
        // Security Settings
        add_settings_field(
            'compliance_mode',
            __('Compliance Mode', 'certnode'),
            [$this, 'compliance_mode_field_callback'],
            'certnode_settings',
            'certnode_security_settings'
        );
        
        add_settings_field(
            'audit_logging',
            __('Audit Logging', 'certnode'),
            [$this, 'audit_logging_field_callback'],
            'certnode_settings',
            'certnode_security_settings'
        );
    }
    
    /**
     * Add admin menu
     */
    public function add_admin_menu()
    {
        // Main menu page
        add_menu_page(
            __('CertNode T17+', 'certnode'),
            __('CertNode', 'certnode'),
            'manage_options',
            'certnode',
            [$this, 'admin_page'],
            'data:image/svg+xml;base64,' . base64_encode('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>'),
            30
        );
        
        // Submenu pages
        add_submenu_page(
            'certnode',
            __('Dashboard', 'certnode'),
            __('Dashboard', 'certnode'),
            'manage_options',
            'certnode',
            [$this, 'admin_page']
        );
        
        add_submenu_page(
            'certnode',
            __('Certifications', 'certnode'),
            __('Certifications', 'certnode'),
            'edit_posts',
            'certnode-certifications',
            [$this, 'certifications_page']
        );
        
        add_submenu_page(
            'certnode',
            __('Analytics', 'certnode'),
            __('Analytics', 'certnode'),
            'edit_posts',
            'certnode-analytics',
            [$this, 'analytics_page']
        );
        
        add_submenu_page(
            'certnode',
            __('Settings', 'certnode'),
            __('Settings', 'certnode'),
            'manage_options',
            'certnode-settings',
            [$this, 'settings_page']
        );
        
        add_submenu_page(
            'certnode',
            __('Audit Log', 'certnode'),
            __('Audit Log', 'certnode'),
            'manage_options',
            'certnode-audit',
            [$this, 'audit_page']
        );
    }
    
    /**
     * Enqueue admin scripts and styles
     */
    public function admin_enqueue_scripts($hook)
    {
        // Only load on CertNode pages
        if (strpos($hook, 'certnode') === false && !in_array($hook, ['post.php', 'post-new.php'])) {
            return;
        }
        
        wp_enqueue_script(
            'certnode-admin',
            CERTNODE_PLUGIN_URL . 'assets/js/admin.js',
            ['jquery', 'wp-util'],
            CERTNODE_VERSION,
            true
        );
        
        wp_enqueue_style(
            'certnode-admin',
            CERTNODE_PLUGIN_URL . 'assets/css/admin.css',
            [],
            CERTNODE_VERSION
        );
        
        // Localize script
        wp_localize_script('certnode-admin', 'certnode_ajax', [
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('certnode_ajax_nonce'),
            'strings' => [
                'certifying' => __('Certifying content...', 'certnode'),
                'certified' => __('Content certified successfully', 'certnode'),
                'error' => __('Certification failed', 'certnode'),
                'confirm_certify' => __('Are you sure you want to certify this content?', 'certnode'),
                'processing' => __('Processing...', 'certnode')
            ]
        ]);
    }
    
    /**
     * Enqueue frontend scripts and styles
     */
    public function frontend_enqueue_scripts()
    {
        if (!$this->options['show_badge']) {
            return;
        }
        
        wp_enqueue_style(
            'certnode-frontend',
            CERTNODE_PLUGIN_URL . 'assets/css/frontend.css',
            [],
            CERTNODE_VERSION
        );
        
        wp_enqueue_script(
            'certnode-frontend',
            CERTNODE_PLUGIN_URL . 'assets/js/frontend.js',
            ['jquery'],
            CERTNODE_VERSION,
            true
        );
    }
    
    /**
     * Add meta boxes
     */
    public function add_meta_boxes()
    {
        $post_types = $this->options['post_types'];
        
        foreach ($post_types as $post_type) {
            add_meta_box(
                'certnode_certification',
                __('CertNode T17+ Certification', 'certnode'),
                [$this, 'certification_meta_box'],
                $post_type,
                'side',
                'high'
            );
        }
    }
    
    /**
     * Certification meta box content
     */
    public function certification_meta_box($post)
    {
        wp_nonce_field('certnode_meta_box', 'certnode_meta_box_nonce');
        
        $certification_id = get_post_meta($post->ID, '_certnode_certification_id', true);
        $certification_status = get_post_meta($post->ID, '_certnode_certification_status', true);
        $certification_data = get_post_meta($post->ID, '_certnode_certification_data', true);
        
        ?>
        <div id="certnode-meta-box">
            <div class="certnode-status-section">
                <?php if ($certification_id): ?>
                    <div class="certnode-status-display">
                        <h4><?php _e('Certification Status', 'certnode'); ?></h4>
                        <div class="status-badge status-<?php echo esc_attr($certification_status); ?>">
                            <?php echo esc_html(ucfirst($certification_status)); ?>
                        </div>
                        
                        <?php if ($certification_data): ?>
                            <div class="certification-details">
                                <h5><?php _e('T17+ Analysis Results', 'certnode'); ?></h5>
                                <div class="analysis-grid">
                                    <?php if (isset($certification_data['tier_analysis']['structural_tier'])): ?>
                                        <div class="analysis-item">
                                            <label><?php _e('Structural Tier:', 'certnode'); ?></label>
                                            <span class="tier-value">T<?php echo esc_html($certification_data['tier_analysis']['structural_tier']); ?></span>
                                        </div>
                                    <?php endif; ?>
                                    
                                    <?php if (isset($certification_data['confidence_score'])): ?>
                                        <div class="analysis-item">
                                            <label><?php _e('Confidence Score:', 'certnode'); ?></label>
                                            <span class="confidence-value"><?php echo esc_html(number_format($certification_data['confidence_score'] * 100, 1)); ?>%</span>
                                        </div>
                                    <?php endif; ?>
                                    
                                    <?php if (isset($certification_data['ics_hash'])): ?>
                                        <div class="analysis-item">
                                            <label><?php _e('ICS Hash:', 'certnode'); ?></label>
                                            <span class="hash-value" title="<?php echo esc_attr($certification_data['ics_hash']); ?>">
                                                <?php echo esc_html(substr($certification_data['ics_hash'], 0, 16)); ?>...
                                            </span>
                                        </div>
                                    <?php endif; ?>
                                    
                                    <?php if (isset($certification_data['vault_seal'])): ?>
                                        <div class="analysis-item">
                                            <label><?php _e('Vault Seal:', 'certnode'); ?></label>
                                            <span class="seal-value"><?php echo esc_html($certification_data['vault_seal']); ?></span>
                                        </div>
                                    <?php endif; ?>
                                </div>
                                
                                <?php if (isset($certification_data['tier_analysis'])): ?>
                                    <div class="tier-analysis-details">
                                        <h6><?php _e('Detailed Analysis', 'certnode'); ?></h6>
                                        <div class="analysis-metrics">
                                            <?php foreach ($certification_data['tier_analysis'] as $key => $value): ?>
                                                <?php if (is_numeric($value) && $key !== 'structural_tier'): ?>
                                                    <div class="metric-item">
                                                        <label><?php echo esc_html(ucwords(str_replace('_', ' ', $key))); ?>:</label>
                                                        <span><?php echo esc_html(is_float($value) ? number_format($value, 3) : $value); ?></span>
                                                    </div>
                                                <?php endif; ?>
                                            <?php endforeach; ?>
                                        </div>
                                    </div>
                                <?php endif; ?>
                            </div>
                        <?php endif; ?>
                        
                        <div class="certification-actions">
                            <button type="button" class="button" id="certnode-refresh-status">
                                <?php _e('Refresh Status', 'certnode'); ?>
                            </button>
                            <button type="button" class="button" id="certnode-view-certificate">
                                <?php _e('View Certificate', 'certnode'); ?>
                            </button>
                        </div>
                    </div>
                <?php else: ?>
                    <div class="certnode-no-certification">
                        <p><?php _e('This content has not been certified yet.', 'certnode'); ?></p>
                        <div class="certification-options">
                            <label for="certification_type"><?php _e('Certification Type:', 'certnode'); ?></label>
                            <select id="certification_type" name="certification_type">
                                <?php foreach ($this->options['certification_types'] as $type): ?>
                                    <option value="<?php echo esc_attr($type); ?>"><?php echo esc_html(ucfirst($type)); ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <button type="button" class="button button-primary" id="certnode-certify-content">
                            <?php _e('Certify Content', 'certnode'); ?>
                        </button>
                    </div>
                <?php endif; ?>
            </div>
            
            <div class="certnode-info-section">
                <h4><?php _e('Certification Info', 'certnode'); ?></h4>
                <div class="info-grid">
                    <div class="info-item">
                        <label><?php _e('Post ID:', 'certnode'); ?></label>
                        <span><?php echo esc_html($post->ID); ?></span>
                    </div>
                    <div class="info-item">
                        <label><?php _e('Content Length:', 'certnode'); ?></label>
                        <span id="content-length"><?php echo esc_html(strlen(strip_tags($post->post_content))); ?> chars</span>
                    </div>
                    <div class="info-item">
                        <label><?php _e('Last Modified:', 'certnode'); ?></label>
                        <span><?php echo esc_html(get_the_modified_date('Y-m-d H:i:s', $post)); ?></span>
                    </div>
                </div>
            </div>
        </div>
        
        <script type="text/javascript">
        jQuery(document).ready(function($) {
            // Update content length on editor change
            function updateContentLength() {
                var content = '';
                if (typeof tinymce !== 'undefined' && tinymce.get('content')) {
                    content = tinymce.get('content').getContent({format: 'text'});
                } else {
                    content = $('#content').val();
                }
                $('#content-length').text(content.length + ' chars');
            }
            
            // Bind to editor events
            if (typeof tinymce !== 'undefined') {
                tinymce.on('AddEditor', function(e) {
                    e.editor.on('keyup change', updateContentLength);
                });
            }
            $('#content').on('keyup change', updateContentLength);
            
            // Certify content button
            $('#certnode-certify-content').on('click', function() {
                var button = $(this);
                var originalText = button.text();
                var certificationType = $('#certification_type').val();
                
                if (!confirm(certnode_ajax.strings.confirm_certify)) {
                    return;
                }
                
                button.prop('disabled', true).text(certnode_ajax.strings.certifying);
                
                $.ajax({
                    url: certnode_ajax.ajax_url,
                    type: 'POST',
                    data: {
                        action: 'certnode_certify',
                        post_id: <?php echo $post->ID; ?>,
                        certification_type: certificationType,
                        nonce: certnode_ajax.nonce
                    },
                    success: function(response) {
                        if (response.success) {
                            location.reload();
                        } else {
                            alert(response.data || certnode_ajax.strings.error);
                        }
                    },
                    error: function() {
                        alert(certnode_ajax.strings.error);
                    },
                    complete: function() {
                        button.prop('disabled', false).text(originalText);
                    }
                });
            });
            
            // Refresh status button
            $('#certnode-refresh-status').on('click', function() {
                var button = $(this);
                var originalText = button.text();
                
                button.prop('disabled', true).text(certnode_ajax.strings.processing);
                
                $.ajax({
                    url: certnode_ajax.ajax_url,
                    type: 'POST',
                    data: {
                        action: 'certnode_check_status',
                        post_id: <?php echo $post->ID; ?>,
                        nonce: certnode_ajax.nonce
                    },
                    success: function(response) {
                        if (response.success && response.data.status_changed) {
                            location.reload();
                        }
                    },
                    complete: function() {
                        button.prop('disabled', false).text(originalText);
                    }
                });
            });
        });
        </script>
        <?php
    }
    
    /**
     * Save post meta
     */
    public function save_post_meta($post_id, $post)
    {
        // Verify nonce
        if (!isset($_POST['certnode_meta_box_nonce']) || 
            !wp_verify_nonce($_POST['certnode_meta_box_nonce'], 'certnode_meta_box')) {
            return;
        }
        
        // Check permissions
        if (!current_user_can('edit_post', $post_id)) {
            return;
        }
        
        // Skip autosave
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }
        
        // Log the save event
        $this->log_event('post_saved', [
            'post_id' => $post_id,
            'post_type' => $post->post_type,
            'user_id' => get_current_user_id()
        ]);
    }
    
    /**
     * Auto-certify content on publish
     */
    public function auto_certify_content($post_id, $post)
    {
        if (!$this->options['auto_certify']) {
            return;
        }
        
        if (!in_array($post->post_type, $this->options['post_types'])) {
            return;
        }
        
        // Check if already certified
        $certification_id = get_post_meta($post_id, '_certnode_certification_id', true);
        if ($certification_id) {
            return;
        }
        
        // Schedule certification
        wp_schedule_single_event(time() + 60, 'certnode_process_certification', [$post_id, 'standard']);
    }
    
    /**
     * AJAX: Certify content
     */
    public function ajax_certify_content()
    {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'], 'certnode_ajax_nonce')) {
            wp_die(__('Security check failed', 'certnode'));
        }
        
        $post_id = intval($_POST['post_id']);
        $certification_type = sanitize_text_field($_POST['certification_type']);
        
        // Check permissions
        if (!current_user_can('edit_post', $post_id)) {
            wp_send_json_error(__('Insufficient permissions', 'certnode'));
        }
        
        $post = get_post($post_id);
        if (!$post) {
            wp_send_json_error(__('Post not found', 'certnode'));
        }
        
        try {
            $result = $this->certify_content($post, $certification_type);
            
            if ($result['success']) {
                wp_send_json_success([
                    'message' => __('Certification request submitted successfully', 'certnode'),
                    'certification_id' => $result['certification_id']
                ]);
            } else {
                wp_send_json_error($result['message']);
            }
        } catch (Exception $e) {
            wp_send_json_error($e->getMessage());
        }
    }
    
    /**
     * AJAX: Check certification status
     */
    public function ajax_check_certification_status()
    {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'], 'certnode_ajax_nonce')) {
            wp_die(__('Security check failed', 'certnode'));
        }
        
        $post_id = intval($_POST['post_id']);
        
        // Check permissions
        if (!current_user_can('edit_post', $post_id)) {
            wp_send_json_error(__('Insufficient permissions', 'certnode'));
        }
        
        $certification_id = get_post_meta($post_id, '_certnode_certification_id', true);
        if (!$certification_id) {
            wp_send_json_error(__('No certification found', 'certnode'));
        }
        
        try {
            $status = $this->api_service->getCertificationStatus($certification_id);
            $current_status = get_post_meta($post_id, '_certnode_certification_status', true);
            
            if ($status['status'] !== $current_status) {
                update_post_meta($post_id, '_certnode_certification_status', $status['status']);
                
                if ($status['status'] === 'completed' && isset($status['data'])) {
                    update_post_meta($post_id, '_certnode_certification_data', $status['data']);
                }
                
                wp_send_json_success([
                    'status' => $status['status'],
                    'status_changed' => true,
                    'data' => $status
                ]);
            } else {
                wp_send_json_success([
                    'status' => $status['status'],
                    'status_changed' => false,
                    'data' => $status
                ]);
            }
        } catch (Exception $e) {
            wp_send_json_error($e->getMessage());
        }
    }
    
    /**
     * Certify content
     */
    private function certify_content($post, $certification_type = 'standard')
    {
        if (empty($this->options['api_key'])) {
            throw new Exception(__('API key not configured', 'certnode'));
        }
        
        // Prepare content
        $content = $this->prepare_content($post);
        
        if (strlen($content) < 10) {
            throw new Exception(__('Content too short for certification', 'certnode'));
        }
        
        // Call API
        $response = $this->api_service->createCertification([
            'content' => $content,
            'certification_type' => $certification_type,
            'metadata' => [
                'wordpress_post_id' => $post->ID,
                'wordpress_post_title' => $post->post_title,
                'wordpress_post_type' => $post->post_type,
                'wordpress_site_url' => get_site_url(),
                'wordpress_user_id' => get_current_user_id()
            ]
        ]);
        
        if (!$response || !isset($response['id'])) {
            throw new Exception(__('API request failed', 'certnode'));
        }
        
        // Save certification data
        update_post_meta($post->ID, '_certnode_certification_id', $response['id']);
        update_post_meta($post->ID, '_certnode_certification_status', $response['status']);
        update_post_meta($post->ID, '_certnode_certification_type', $certification_type);
        update_post_meta($post->ID, '_certnode_certification_date', current_time('mysql'));
        
        if (isset($response['content_hash'])) {
            update_post_meta($post->ID, '_certnode_content_hash', $response['content_hash']);
        }
        
        // Log the certification
        $this->log_event('content_certified', [
            'post_id' => $post->ID,
            'certification_id' => $response['id'],
            'certification_type' => $certification_type,
            'user_id' => get_current_user_id()
        ]);
        
        return [
            'success' => true,
            'certification_id' => $response['id'],
            'message' => __('Certification request submitted successfully', 'certnode')
        ];
    }
    
    /**
     * Prepare content for certification
     */
    private function prepare_content($post)
    {
        $content = $post->post_title . "\n\n" . $post->post_content;
        
        // Remove shortcodes
        $content = strip_shortcodes($content);
        
        // Remove HTML tags
        $content = wp_strip_all_tags($content);
        
        // Normalize whitespace
        $content = preg_replace('/\s+/', ' ', $content);
        $content = trim($content);
        
        return $content;
    }
    
    /**
     * Add certification badge to content
     */
    public function add_certification_badge($content)
    {
        if (!$this->options['show_badge'] || !is_single()) {
            return $content;
        }
        
        global $post;
        
        if (!in_array($post->post_type, $this->options['post_types'])) {
            return $content;
        }
        
        $certification_status = get_post_meta($post->ID, '_certnode_certification_status', true);
        $certification_data = get_post_meta($post->ID, '_certnode_certification_data', true);
        
        if (!$certification_status) {
            return $content;
        }
        
        $badge = $this->generate_certification_badge($certification_status, $certification_data);
        
        if ($this->options['badge_position'] === 'top') {
            return $badge . $content;
        } else {
            return $content . $badge;
        }
    }
    
    /**
     * Generate certification badge HTML
     */
    private function generate_certification_badge($status, $data = null)
    {
        $badge_class = 'certnode-badge certnode-badge-' . $status;
        $badge_text = ucfirst($status);
        $tier_info = '';
        
        if ($status === 'completed' && $data && isset($data['tier_analysis']['structural_tier'])) {
            $tier = $data['tier_analysis']['structural_tier'];
            $confidence = isset($data['confidence_score']) ? round($data['confidence_score'] * 100, 1) : 0;
            $tier_info = sprintf(__('T%d • %s%% Confidence', 'certnode'), $tier, $confidence);
        }
        
        ob_start();
        ?>
        <div class="<?php echo esc_attr($badge_class); ?>">
            <div class="certnode-badge-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                </svg>
            </div>
            <div class="certnode-badge-content">
                <div class="certnode-badge-title">
                    <?php _e('CertNode T17+ Certified', 'certnode'); ?>
                </div>
                <div class="certnode-badge-status">
                    <?php echo esc_html($badge_text); ?>
                    <?php if ($tier_info): ?>
                        <span class="certnode-badge-tier"><?php echo esc_html($tier_info); ?></span>
                    <?php endif; ?>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Log event for audit trail
     */
    private function log_event($action, $data = [])
    {
        if (!$this->options['audit_logging']) {
            return;
        }
        
        global $wpdb;
        
        $wpdb->insert(
            $wpdb->prefix . 'certnode_audit_log',
            [
                'user_id' => get_current_user_id(),
                'action' => $action,
                'data' => json_encode($data),
                'ip_address' => $this->get_client_ip(),
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                'timestamp' => current_time('mysql')
            ],
            ['%d', '%s', '%s', '%s', '%s', '%s']
        );
    }
    
    /**
     * Get client IP address
     */
    private function get_client_ip()
    {
        $ip_keys = ['HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'HTTP_CLIENT_IP', 'REMOTE_ADDR'];
        
        foreach ($ip_keys as $key) {
            if (!empty($_SERVER[$key])) {
                $ip = $_SERVER[$key];
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }
    
    /**
     * Admin page content
     */
    public function admin_page()
    {
        ?>
        <div class="wrap">
            <h1><?php _e('CertNode T17+ Dashboard', 'certnode'); ?></h1>
            
            <div class="certnode-dashboard">
                <div class="certnode-stats-grid">
                    <?php $this->render_dashboard_stats(); ?>
                </div>
                
                <div class="certnode-recent-activity">
                    <h2><?php _e('Recent Activity', 'certnode'); ?></h2>
                    <?php $this->render_recent_activity(); ?>
                </div>
                
                <div class="certnode-system-status">
                    <h2><?php _e('System Status', 'certnode'); ?></h2>
                    <?php $this->render_system_status(); ?>
                </div>
            </div>
        </div>
        <?php
    }
    
    /**
     * Render dashboard statistics
     */
    private function render_dashboard_stats()
    {
        global $wpdb;
        
        // Get certification counts
        $total_certifications = $wpdb->get_var("
            SELECT COUNT(*) FROM {$wpdb->postmeta} 
            WHERE meta_key = '_certnode_certification_id'
        ");
        
        $completed_certifications = $wpdb->get_var("
            SELECT COUNT(*) FROM {$wpdb->postmeta} 
            WHERE meta_key = '_certnode_certification_status' AND meta_value = 'completed'
        ");
        
        $pending_certifications = $wpdb->get_var("
            SELECT COUNT(*) FROM {$wpdb->postmeta} 
            WHERE meta_key = '_certnode_certification_status' AND meta_value IN ('pending', 'processing')
        ");
        
        $stats = [
            [
                'title' => __('Total Certifications', 'certnode'),
                'value' => $total_certifications,
                'icon' => 'shield',
                'color' => 'blue'
            ],
            [
                'title' => __('Completed', 'certnode'),
                'value' => $completed_certifications,
                'icon' => 'check-circle',
                'color' => 'green'
            ],
            [
                'title' => __('Pending', 'certnode'),
                'value' => $pending_certifications,
                'icon' => 'clock',
                'color' => 'orange'
            ],
            [
                'title' => __('Success Rate', 'certnode'),
                'value' => $total_certifications > 0 ? round(($completed_certifications / $total_certifications) * 100, 1) . '%' : '0%',
                'icon' => 'trending-up',
                'color' => 'purple'
            ]
        ];
        
        foreach ($stats as $stat) {
            ?>
            <div class="certnode-stat-card certnode-stat-<?php echo esc_attr($stat['color']); ?>">
                <div class="certnode-stat-icon">
                    <?php $this->render_icon($stat['icon']); ?>
                </div>
                <div class="certnode-stat-content">
                    <div class="certnode-stat-value"><?php echo esc_html($stat['value']); ?></div>
                    <div class="certnode-stat-title"><?php echo esc_html($stat['title']); ?></div>
                </div>
            </div>
            <?php
        }
    }
    
    /**
     * Render icon SVG
     */
    private function render_icon($icon)
    {
        $icons = [
            'shield' => '<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>',
            'check-circle' => '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="9,11 12,14 22,4"/>',
            'clock' => '<circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>',
            'trending-up' => '<polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/><polyline points="17,6 23,6 23,12"/>'
        ];
        
        if (isset($icons[$icon])) {
            echo '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' . $icons[$icon] . '</svg>';
        }
    }
    
    /**
     * Settings page content
     */
    public function settings_page()
    {
        ?>
        <div class="wrap">
            <h1><?php _e('CertNode T17+ Settings', 'certnode'); ?></h1>
            
            <form method="post" action="options.php">
                <?php
                settings_fields('certnode_options');
                do_settings_sections('certnode_settings');
                submit_button();
                ?>
            </form>
        </div>
        <?php
    }
    
    /**
     * Sanitize options
     */
    public function sanitize_options($input)
    {
        $sanitized = [];
        
        // API settings
        $sanitized['api_key'] = sanitize_text_field($input['api_key'] ?? '');
        $sanitized['api_base'] = esc_url_raw($input['api_base'] ?? CERTNODE_API_BASE);
        
        // Content settings
        $sanitized['auto_certify'] = !empty($input['auto_certify']);
        $sanitized['post_types'] = array_map('sanitize_text_field', $input['post_types'] ?? ['post', 'page']);
        $sanitized['certification_types'] = array_map('sanitize_text_field', $input['certification_types'] ?? ['standard']);
        
        // Display settings
        $sanitized['show_badge'] = !empty($input['show_badge']);
        $sanitized['badge_position'] = in_array($input['badge_position'] ?? 'bottom', ['top', 'bottom']) ? $input['badge_position'] : 'bottom';
        
        // Security settings
        $sanitized['compliance_mode'] = !empty($input['compliance_mode']);
        $sanitized['audit_logging'] = !empty($input['audit_logging']);
        
        return array_merge($this->options, $sanitized);
    }
}

/**
 * CertNode API Service Class
 */
class CertNodeAPIService
{
    private $api_key;
    private $api_base;
    private $timeout;
    
    public function __construct($options)
    {
        $this->api_key = $options['api_key'];
        $this->api_base = rtrim($options['api_base'], '/');
        $this->timeout = 30;
    }
    
    public function createCertification($data)
    {
        return $this->makeRequest('/certifications', 'POST', $data);
    }
    
    public function getCertificationStatus($certification_id)
    {
        return $this->makeRequest("/certifications/{$certification_id}", 'GET');
    }
    
    private function makeRequest($endpoint, $method = 'GET', $data = null)
    {
        $url = $this->api_base . $endpoint;
        
        $args = [
            'method' => $method,
            'timeout' => $this->timeout,
            'headers' => [
                'Authorization' => 'Bearer ' . $this->api_key,
                'Content-Type' => 'application/json',
                'User-Agent' => 'CertNode-WordPress-Plugin/' . CERTNODE_VERSION
            ]
        ];
        
        if ($data && in_array($method, ['POST', 'PUT', 'PATCH'])) {
            $args['body'] = json_encode($data);
        }
        
        $response = wp_remote_request($url, $args);
        
        if (is_wp_error($response)) {
            throw new Exception('API request failed: ' . $response->get_error_message());
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        
        if ($status_code >= 400) {
            $error_data = json_decode($body, true);
            $error_message = isset($error_data['detail']) ? $error_data['detail'] : "HTTP {$status_code}";
            throw new Exception("API error: {$error_message}");
        }
        
        return json_decode($body, true);
    }
}

/**
 * CertNode Database Class
 */
class CertNodeDatabase
{
    private $version = '1.0.0';
    
    public function createTables()
    {
        global $wpdb;
        
        $charset_collate = $wpdb->get_charset_collate();
        
        // Certifications table
        $sql = "CREATE TABLE {$wpdb->prefix}certnode_certifications (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            post_id bigint(20) NOT NULL,
            certification_id varchar(255) NOT NULL,
            status varchar(50) NOT NULL DEFAULT 'pending',
            certification_type varchar(50) NOT NULL DEFAULT 'standard',
            tier_analysis longtext,
            confidence_score decimal(5,4),
            ics_hash varchar(64),
            vault_seal varchar(255),
            created_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            PRIMARY KEY (id),
            KEY post_id (post_id),
            KEY certification_id (certification_id),
            KEY status (status),
            KEY created_at (created_at)
        ) $charset_collate;";
        
        // Audit log table
        $sql .= "CREATE TABLE {$wpdb->prefix}certnode_audit_log (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20),
            action varchar(100) NOT NULL,
            data longtext,
            ip_address varchar(45),
            user_agent text,
            timestamp datetime NOT NULL,
            PRIMARY KEY (id),
            KEY user_id (user_id),
            KEY action (action),
            KEY timestamp (timestamp)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
        
        update_option('certnode_db_version', $this->version);
    }
    
    public function checkVersion()
    {
        $installed_version = get_option('certnode_db_version', '0.0.0');
        
        if (version_compare($installed_version, $this->version, '<')) {
            $this->createTables();
        }
    }
}

// Initialize the plugin
CertNodePlugin::getInstance();

// Additional WordPress hooks for the plugin
add_action('certnode_process_certification', function($post_id, $certification_type) {
    $plugin = CertNodePlugin::getInstance();
    $post = get_post($post_id);
    if ($post) {
        try {
            $plugin->certify_content($post, $certification_type);
        } catch (Exception $e) {
            error_log('CertNode certification failed: ' . $e->getMessage());
        }
    }
}, 10, 2);

// Cleanup expired certifications
add_action('certnode_cleanup_expired', function() {
    global $wpdb;
    
    // Remove certifications older than 1 year
    $wpdb->query($wpdb->prepare("
        DELETE FROM {$wpdb->prefix}certnode_certifications 
        WHERE created_at < %s
    ", date('Y-m-d H:i:s', strtotime('-1 year'))));
    
    // Remove audit logs older than 2 years
    $wpdb->query($wpdb->prepare("
        DELETE FROM {$wpdb->prefix}certnode_audit_log 
        WHERE timestamp < %s
    ", date('Y-m-d H:i:s', strtotime('-2 years'))));
});

// Sync usage statistics
add_action('certnode_sync_usage', function() {
    $plugin = CertNodePlugin::getInstance();
    // Implementation for syncing usage stats with CertNode API
});
?>

