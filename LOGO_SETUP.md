# Logo Setup Instructions

## Important: Add Your Logo

The application is configured to use your Sri Sai Mobiles logo, but you need to add the actual image file.

### Steps:

1. Save your logo image as `logo.png`
2. Place it in the `public` folder of your project
3. The logo should be:
   - PNG format (transparent background recommended)
   - Square or nearly square dimensions (e.g., 500x500px)
   - Clear and high resolution

### Where the logo appears:

1. **Login Page** - Large logo above the login form
2. **Sidebar** - Small logo next to "Sri Sai Mobiles" text
3. **PDF Invoice** - Logo at the top of the invoice near shop name

### Current logo locations in code:

- `/public/logo.png` - Main logo file (REPLACE THIS)
- Login page: `app/page.tsx`
- Sidebar: `components/Sidebar.tsx`
- Invoice: `app/dashboard/products/page.tsx`

### Phone Number Added:

The phone number **9092446695** has been added to:
- PDF invoices
- Can be added to other locations as needed

Once you replace the `public/logo.png` file with your actual logo image, it will automatically appear in all the configured locations.
