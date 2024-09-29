import domReady from '@wordpress/dom-ready';
import { createRoot } from '@wordpress/element';
import { useState, useEffect } from '@wordpress/element';
import { TextareaControl, Button, SelectControl, CheckboxControl } from '@wordpress/components';
import React from 'react';

const SettingsPage = () => {
  const [notice, setNotice] = useState('');
  const [bgColor, setBgColor] = useState('#a0b8c3');
  const [textColor, setTextColor] = useState('#ffffff');
  const [borderRadius, setBorderRadius] = useState(5);
  const [fontSize, setFontSize] = useState('16px');
  const [notices, setNotices] = useState({});
  const [notification, setNotification] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isVisible, setIsVisible] = useState(false);

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

    fetchNotices();
    fetchCategories();
  }, []);

  const handleClick = () => {
    setIsVisible(prev => !prev); // Toggle the visibility
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
        category: selectedCategory,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response:', errorData);
      setNotification('Failed to save notice. Please try again.');
      return;
    }

    setNotification('Notice saved successfully!');
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
    <div>
      <h1>Product Notice – Global Settings</h1>
      {notification && (
        <div style={{ marginBottom: '10px', color: 'green' }}>
          {notification}
        </div>
      )}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', alignItems: 'center', gap: '10px',
        paddingTop: '10px'
      }}>
        <h4 style={{ gridColumn: 'span 2', margin: '0' }}>Global Product Notice</h4>
        <div style={{ gridColumn: 'span 4', width: '100%' }}>
          <TextareaControl
            id="product-notice"
            label=""
            value={notice}
            onChange={(value) => setNotice(value)}
            style={{ height: '39px', width: '100%' }} // Set height to 39px and width to 100%
          />
        </div>
      </div>

      <h3 style={{ paddingTop: '10px' }}>Display Rules</h3>
      <h4>Use to display the global notice on selected product categories and tags.</h4>


      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', alignItems: 'center', gap: '10px', margin: '10px 0' }}>
        <h4 style={{ gridColumn: 'span 2', margin: '0' }} >Enable Rules </h4>

        <CheckboxControl style={{ gridColumn: 'span 2', margin: '0' }}
          label=""

          onChange={handleClick} // Toggle visibility on change
        />

      </div>





      {isVisible &&
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', alignItems: 'center', gap: '10px', margin: '10px 0' }}>
          <label style={{ gridColumn: 'span 2', margin: '0' }}>Select Product Category</label>
          <div style={{ gridColumn: 'span 6', minWidth: '190px', maxWidth: '67%' }}>
            <SelectControl
              value={selectedCategory}
              options={[
                { label: 'Select a category', value: '' },
                ...categories.map(category => ({
                  label: `${category.name} (${category.count} products)`,
                  value: category.term_id.toString(),
                })),
              ]}
              onChange={(value) => setSelectedCategory(value)}
              style={{ width: '100%', fontSize: '12px' }}
            />
          </div>
        </div>
      } {/* Conditional rendering */}



      <div>
        <h3 style={{ paddingTop: '10px' }}>Appearance</h3>
        <h4>Customize the look & feel of your Global Notice.</h4>

        {/* Background Color */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', alignItems: 'center', gap: '10px', paddingTop: '10px' }}>
          <label style={{ gridColumn: 'span 2', margin: '0' }}>Select Background Color:</label>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            style={{ gridColumn: 'span 2', margin: '0', width: '50px' }}
          />
        </div>

        {/* Text Color */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', alignItems: 'center', gap: '10px', paddingTop: '10px' }}>
          <label style={{ gridColumn: 'span 2', margin: '0' }}>Select Text Color:</label>
          <input
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
            style={{ gridColumn: 'span 2', margin: '0', width: '50px' }}
          />
        </div>

        {/* Font Size */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', alignItems: 'center', gap: '10px', paddingTop: '10px' }}>
          <label style={{ gridColumn: 'span 2', margin: '0' }}>Select Font Size (px):</label>
          <input
            type="number"
            value={parseInt(fontSize)} // Convert to integer for display
            onChange={(e) => setFontSize(`${e.target.value}px`)} // Set font size in px
            style={{ gridColumn: 'span 2', margin: '0', width: '50px' }}
          />
        </div>

        {/* Border Radius */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', alignItems: 'center', gap: '10px', paddingTop: '10px' }}>
          <label style={{ gridColumn: 'span 2', margin: '0' }}>Border Radius:</label>
          <input
            type="number"
            value={borderRadius}
            onChange={(e) => setBorderRadius(e.target.value)}
            style={{ gridColumn: 'span 2', margin: '0', width: '50px' }}
          />
        </div>
      </div>


      <div
        style={{
          marginTop: '20px',
          padding: '10px',
          backgroundColor: bgColor,
          borderRadius: `${borderRadius}px`,
          color: textColor,
          gridColumn: 'span 12', // Make this span all columns
        }}
      >


        <p style={{
        }}>
          {notice}
        </p>


      </div>

      <Button variant="contained" onClick={handleSave}>
        Save Notice
      </Button>
    </div >
  );
};

domReady(() => {
  const root = createRoot(
    document.getElementById('product-notices-react-settings')
  );

  root.render(<SettingsPage />);
});
