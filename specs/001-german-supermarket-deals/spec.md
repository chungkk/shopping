# Feature Specification: German Supermarket Deals Aggregator

**Feature Branch**: `001-german-supermarket-deals`  
**Created**: 2025-12-03  
**Status**: Draft  
**Input**: User description: "Tạo một trang web thu thập và tổng hợp sản phẩm giảm giá từ các siêu thị ở Đức, bắt đầu với Globus"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Today's Deals at Globus (Priority: P1)

A shopper wants to quickly see what products are on sale at Globus today without visiting the physical store or navigating the full supermarket website. They open the deals aggregator, select Globus from the supermarket list, and immediately see a list of discounted products with their original and sale prices, along with product images.

**Why this priority**: This is the core value proposition - users need to see deals at a glance. Without this, the entire application has no purpose.

**Independent Test**: Can be fully tested by loading the Globus deals page and verifying that discounted products are displayed with prices, images, and validity dates.

**Acceptance Scenarios**:

1. **Given** the user is on the homepage, **When** they select "Globus" from the supermarket dropdown, **Then** they see a list of products currently on sale at Globus
2. **Given** the user views a deal, **When** looking at product details, **Then** they can see the product name, current price, original price (if available), discount percentage, product image, and promotion validity dates
3. **Given** there are active deals available, **When** the page loads, **Then** products with the highest discounts are prominently displayed

---

### User Story 2 - Filter Deals by Category (Priority: P2)

A shopper is looking for specific types of discounted products (e.g., beverages, dairy, meat). They use category filters to narrow down the deals list to only show products from their desired category.

**Why this priority**: Filtering enhances usability significantly, allowing users to find relevant deals faster. It builds upon the core viewing functionality.

**Independent Test**: Can be tested by selecting a category filter and verifying only products from that category are displayed.

**Acceptance Scenarios**:

1. **Given** the user is viewing Globus deals, **When** they select "Getränke" (Beverages) category, **Then** only beverage deals are displayed
2. **Given** multiple categories exist, **When** viewing the filter options, **Then** all available product categories are listed
3. **Given** a category has no current deals, **When** user selects that category, **Then** a friendly message indicates no deals are available in that category

---

### User Story 3 - Search for Specific Products (Priority: P2)

A shopper is looking for deals on a specific product (e.g., "Milch" or "Cola"). They enter a search term and see matching discounted products across all categories.

**Why this priority**: Search complements category filtering, enabling users to find specific products quickly.

**Independent Test**: Can be tested by entering a search term and verifying matching products are returned.

**Acceptance Scenarios**:

1. **Given** the user is on the Globus deals page, **When** they search for "Pizza", **Then** all pizza-related deals are displayed
2. **Given** a search returns no results, **When** viewing the results page, **Then** a message suggests trying different keywords or browsing categories

---

### User Story 4 - View Product Details (Priority: P3)

A shopper wants more information about a specific deal before deciding to visit the store. They click on a product to see enlarged images, detailed description, and validity period.

**Why this priority**: Enhances user confidence in deals but is not essential for core functionality.

**Independent Test**: Can be tested by clicking a product and verifying detailed information is displayed.

**Acceptance Scenarios**:

1. **Given** the user clicks on a product card, **When** the detail view opens, **Then** they see a larger product image, full product name, price details, and promotion dates
2. **Given** the product is from a weekly flyer, **When** viewing details, **Then** the source (e.g., "Wochenangebot KW49") is displayed

---

### User Story 5 - Mobile-Friendly Experience (Priority: P3)

A shopper uses their mobile phone while planning shopping on the go. The website adapts to their screen size, making it easy to browse deals, filter, and search on a smaller screen.

**Why this priority**: Mobile support expands accessibility but core features should work first.

**Independent Test**: Can be tested by accessing the site on a mobile device or viewport and verifying all features are usable.

**Acceptance Scenarios**:

1. **Given** a user accesses the site on a mobile device, **When** viewing the deals list, **Then** products are displayed in a readable, touch-friendly layout
2. **Given** a mobile user wants to filter, **When** tapping the filter button, **Then** a mobile-optimized filter panel appears

---

### Edge Cases

- What happens when Globus website is temporarily unavailable during data update?
- How does the system handle products with no images available?
- What happens when a promotion has expired between crawl time and user viewing?
- How are products with multiple promotions (e.g., PAYBACK bonus + price discount) displayed?
- What happens if product prices are listed in different formats (per kg, per piece, per liter)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST perform initial full crawl of product catalog from https://produkte.globus.de/ including product name, image, category, and current price (one-time setup + periodic refresh)
- **FR-002**: System MUST crawl promotion/discount data daily from Globus weekly flyers (e.g., https://www.globus.de/halle-dieselstrasse/aktuelles-prospekt.php) to get current deals
- **FR-003**: System MUST extract for each discounted product: name, current price, original price (if available), discount percentage, validity dates, and product image
- **FR-004**: System MUST categorize products according to Globus's product categories (Getränke, Obst & Gemüse, Fleisch & Fisch, Tiefkühl, etc.)
- **FR-005**: Users MUST be able to select a supermarket from a list (starting with Globus only)
- **FR-006**: Users MUST be able to filter deals by product category
- **FR-007**: Users MUST be able to search for products by name/keyword
- **FR-008**: System MUST display deal validity period (start and end dates)
- **FR-009**: System MUST update deal data at least once daily
- **FR-010**: Users MUST be able to view the application on both desktop and mobile devices
- **FR-011**: System MUST support adding additional supermarket sources in the future (Aldi, Lidl, Netto, Penny, Norma, Rewe, Edeka, Kaufland)
- **FR-012**: System MUST handle products with unit prices (per kg, per liter, per piece) consistently
- **FR-013**: System MUST retry crawling every 1 hour if previous crawl fails
- **FR-014**: System MUST display stale data with "Last updated: [timestamp]" warning when crawl is failing
- **FR-015**: User interface MUST be in Vietnamese language (product names remain in German as crawled from source)
- **FR-016**: System MUST display expired deals with "Đã hết hạn" label and grayed-out styling (not hidden immediately)
- **FR-017**: System MUST paginate deal listings with 30 products per page and navigation buttons

### Key Entities

- **Product**: A product available at a supermarket (name, image URL, category, brand, unit type, base price)
- **Deal**: A promotional offer for a product (product reference, discounted price, original price, discount percentage, start date, end date, source/flyer reference)
- **Supermarket**: A German supermarket chain (name, logo, website URL, location-specific info)
- **Category**: Product grouping as used by supermarkets (name, parent category, supermarket reference)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can find and view Globus deals within 3 seconds of page load
- **SC-002**: At least 95% of products displayed have images and correct pricing information
- **SC-003**: Deal data is refreshed at least once every 24 hours
- **SC-004**: 90% of users can successfully filter deals by category on first attempt
- **SC-005**: Website loads and functions correctly on devices with screens 320px wide and larger
- **SC-006**: Search results return relevant products within 2 seconds
- **SC-007**: Users can identify expired vs. active deals at a glance
- **SC-008**: The system architecture allows adding a new supermarket source within one development sprint

## Clarifications

### Session 2025-12-03

- Q: Chiến lược crawl dữ liệu? → A: Lần đầu crawl toàn bộ sản phẩm để có data tổng quát, sau đó crawl từ tờ rơi để lấy sản phẩm khuyến mãi theo ngày cụ thể
- Q: Xử lý khi crawl thất bại? → A: Thử lại sau mỗi 1 giờ, trong lúc lỗi hiển thị dữ liệu cũ + cảnh báo "Cập nhật lần cuối: [thời gian]"
- Q: Ngôn ngữ giao diện? → A: Tiếng Việt
- Q: Xử lý khuyến mãi hết hạn trong phiên? → A: Giữ hiển thị nhưng đánh dấu "Đã hết hạn" với màu xám
- Q: Phân trang danh sách sản phẩm? → A: 30 sản phẩm/trang với nút phân trang

## Assumptions

- Globus product and promotion data is publicly accessible via their websites (produkte.globus.de and weekly flyer pages)
- Product categories from Globus can be mapped to a unified category system
- Weekly flyer PDFs can be parsed for structured deal information, or equivalent data is available in web format
- The initial launch will focus on one Globus location (Halle-Dieselstraße) with expansion to other locations later
- Users primarily want to see current deals; historical deal tracking is out of scope for initial release
- Authentication/user accounts are not required for the initial release
