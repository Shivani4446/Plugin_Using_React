import domReady from '@wordpress/dom-ready';
import { createRoot } from '@wordpress/element';
import { useState, useEffect } from '@wordpress/element';
import { Panel, PanelBody, PanelRow, Button, TextareaControl, CheckboxControl, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';


// test
const SettingsPage = () => {
  const [notice, setNotice] = useState('');
  const [bgColor, setBgColor] = useState('#a0b8c3');
  const [textColor, setTextColor] = useState('#ffffff');
  const [borderRadius, setBorderRadius] = useState(5);
  const [fontSize, setFontSize] = useState('16px');
  const [notices, setNotices] = useState({});
  const [notification, setNotification] = useState('');
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isVisible, setIsVisible] = useState(false); const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const fetchNotices = async () => {
      const response = await fetch('/wp-json/product-notices/v1/get-notices/');
      if (response.ok) {
        const data = await response.json();
        const userId = get_current_user_id(); // Replace with actual user ID retrieval
        setNotices(data);
        if (data[userId]) {
          setNotice(data[userId]);
          setBgColor(data[`${userId}_color`] || '#a0b8c3');
          setTextColor(data[`${userId}_textColor`] || '#ffffff');
          setBorderRadius(data[`${userId}_borderRadius`] || 5);
          setFontSize(data[`${userId}_fontSize`] || '16px');
        }
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await fetch('/wp-json/product-notices/v1/get-product-categories', {
          headers: {
            'X-WP-Nonce': wpApiSettings.nonce,
          },
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
          console.log('Fetched product categories:', data.length);
        } else {
          console.error('Failed to fetch product categories:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error fetching product categories:', error);
      }
    };


    const fetchTags = async () => {
      try {
        const response = await fetch('/wp-json/product-notices/v1/get-product-tags', {
          headers: {
            'X-WP-Nonce': wpApiSettings.nonce,
          },
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setTags(data);
          console.log('Fetched product tags:', data.length);
        } else {
          console.error('Failed to fetch product tags:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error fetching product tags:', error);
      }
    };

    fetchNotices();
    fetchCategories();
    fetchTags();
  }, []);

  const handleClick = () => {
    setIsVisible(prev => !prev);
  };

  const handleSave = async () => {
    if (notice.trim() === '') return;

    const response = await fetch('/wp-json/product-notices/v1/save/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-WP-Nonce': wpApiSettings.nonce,
      },
      body: JSON.stringify({
        notice,
        bgColor,
        textColor,
        borderRadius,
        fontSize,
        tags: selectedTags,
        category: selectedCategory,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response:', errorData);
      setNotification(__('Failed to save notice. Please try again.', 'text-domain'));
      return;
    }

    setNotification(__('Notice saved successfully!', 'text-domain'));
    const userId = get_current_user_id(); // Replace with actual user ID retrieval
    setNotices((prevNotices) => ({
      ...prevNotices,
      [userId]: notice,
      [`${userId}_color`]: bgColor,
      [`${userId}_textColor`]: textColor,
      [`${userId}_borderRadius`]: borderRadius,
      [`${userId}_fontSize`]: fontSize,
      [`${userId}_category`]: selectedCategory,
    }));
  };


  return (
    <Panel>
      <PanelBody style={{ backgroundColor: '#F5E3D8', margin: '10px' }}>
        <PanelRow>
          <h1>{__('Product Notice – Global Settings', 'text-domain')}</h1>
          {notification && (
            <div style={{ marginBottom: '10px', color: 'green' }}>
              {notification}
            </div>
          )}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', alignItems: 'center', gap: '10px',
            paddingTop: '10px'
          }}>
            <h3 style={{ gridColumn: 'span 2', margin: '0', marginTop: '10px' }}>{__('Global Product Notice', 'text-domain')}</h3>
            <div style={{ gridColumn: 'span 4', width: '100%' }}>
              <TextareaControl
                id="product-notice"
                label=""
                value={notice}
                onChange={setNotice}
                style={{ height: '39px', width: '100%' }} // Set height to 39px and width to 100%
              />
            </div>
          </div>
        </PanelRow>

        <PanelRow>
          <h2 style={{ paddingTop: '25px' }}>{__('Display Rules', 'text-domain')}</h2>
          <h4>{__('Use to display the global notice on selected product categories and tags.', 'text-domain')}</h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', alignItems: 'center', gap: '10px', margin: '10px 0' }}>
            <h3 style={{ gridColumn: 'span 2', margin: '0' }}>{__('Enable Rules', 'text-domain')}</h3>
            <CheckboxControl

              onChange={handleClick} // Toggle visibility on change
              style={{ gridColumn: 'span 2', margin: '0' }}
            />
          </div>
        </PanelRow>

        {isVisible && (
          <PanelRow>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', alignItems: 'center', gap: '10px', margin: '10px 0' }}>
              <h4 style={{ gridColumn: 'span 2', margin: '0' }}>{__('Show on Category  ', 'text-domain')}</h4>
              <div style={{ gridColumn: 'span 6', minWidth: '190px', maxWidth: '67%' }}>
                <SelectControl
                  value={selectedCategory}
                  options={[
                    { label: __('Select one or more categories', 'text-domain'), value: '' },
                    ...categories.map(category => ({
                      label: `${category.name}`,
                      value: category.term_id.toString(),
                    })),
                  ]}
                  onChange={(value) => setSelectedCategory(value)}
                  style={{ width: '100%', fontSize: '12px', height: '39px' }}
                />
              </div>
            </div>


            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', alignItems: 'center', gap: '10px', margin: '10px 0' }}>
              <h4 style={{ gridColumn: 'span 2', margin: '0' }}>{__('Show on Tags', 'text-domain')}</h4>
              <div style={{ gridColumn: 'span 6', minWidth: '190px', maxWidth: '67%' }}>
                <SelectControl
                  value={selectedTags} // Use selectedTags here
                  options={[
                    { label: __('Select one or more tags', 'text-domain'), value: '' },
                    ...tags.map(tag => ({
                      label: `${tag.name}`,
                      value: tag.term_taxonomy_id.toString(),
                    })),
                  ]}
                  onChange={(value) => setSelectedTags(value)} // Update selectedTags here
                  style={{ width: '100%', fontSize: '12px', height: '39px' }}
                />
              </div>
            </div>
          </PanelRow>


        )}


        <PanelRow>
          <h2 style={{ paddingTop: '25px' }}>{__('Appearance', 'text-domain')}</h2>
          <h4>{__('Customize the look & feel of your Global Notice.', 'text-domain')}</h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', alignItems: 'center', gap: '10px', width: '100%' }}>
            <h4 style={{ gridColumn: 'span 2', margin: '0' }}>{__('Select Background Color:', 'text-domain')}</h4>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              style={{ gridColumn: 'span 2', margin: '0', width: '50px' }}
            />
          </div>

        </PanelRow>

        <PanelRow>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', alignItems: 'center', gap: '10px', paddingTop: '10px', width: '100%' }}>
            <h4 style={{ gridColumn: 'span 2', margin: '0' }}>{__('Select Text Color:', 'text-domain')}</h4>
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              style={{ gridColumn: 'span 2', margin: '0', width: '50px' }}
            />
          </div>
        </PanelRow>

        <PanelRow>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', alignItems: 'center', gap: '10px', paddingTop: '10px', width: '100%' }}>
            <h4 style={{ gridColumn: 'span 2', margin: '0' }}>{__('Select Font Size (px):', 'text-domain')}</h4>
            <input
              type="number"
              value={parseInt(fontSize)} // Convert to integer for display
              onChange={(e) => setFontSize(`${e.target.value}px`)} // Set font size in px
              style={{ gridColumn: 'span 2', margin: '0', width: '50px' }}
            />
          </div>
        </PanelRow>


        <PanelRow>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', alignItems: 'center', gap: '10px', paddingTop: '10px', width: '100%' }}>
            <h4 style={{ gridColumn: 'span 2', margin: '0' }}>{__('Border Radius:', 'text-domain')}</h4>
            <input
              type="number"
              value={borderRadius}
              onChange={(e) => setBorderRadius(e.target.value)}
              style={{ gridColumn: 'span 2', margin: '0', width: '50px' }}
            />
          </div>
        </PanelRow>

        <PanelRow>
          <h2 style={{ paddingTop: '20px' }}>{__('Preview', 'text-domain')}</h2>
          <div
            style={{
              marginTop: '20px',
              padding: '10px',
              backgroundColor: bgColor,
              fontSize: fontSize,
              borderRadius: `${borderRadius}px`,
              color: textColor,
            }}
          >
            <p style={{ fontSize: fontSize }}> {/* Apply font size here only to the notice text */}
              {notice}
            </p>

          </div>
        </PanelRow>

        <Button
          onClick={handleSave}
          style={{
            background: 'linear-gradient(90deg, rgb(24 171 250) 0%, rgb(70, 130, 250) 100%)', // Blue gradient
            color: '#fff',
            padding: '10px 20px',
            marginTop: '18px',
            borderRadius: '5px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            transition: 'background 0.3s ease', // Smooth transition for hover effect
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(90deg, rgb(70, 130, 250) 0%, rgb(24, 47, 250) 100%)'; // Change gradient on hover
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(90deg, rgb(24, 47, 250) 0%, rgb(70, 130, 250) 100%)'; // Revert gradient
          }}
        >
          {__('Save Notice', 'text-domain')}
        </Button>

      </PanelBody>
    </Panel>
  );
};

domReady(() => {
  const root = createRoot(document.getElementById('product-notices-react-settings'));
  root.render(<SettingsPage />);
});
