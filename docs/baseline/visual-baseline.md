# Visual baseline

The captures below document representative states. They are comparison evidence, not pixel-perfect specifications for the rebuild.

## Viewport matrix

| State | Viewport | Evidence |
| --- | --- | --- |
| Catalogue | Desktop, 1440 × 1000 | [catalogue-desktop.jpg](screenshots/catalogue-desktop.jpg) |
| Product details | Desktop, 1440 × 1000 | [details-desktop.jpg](screenshots/details-desktop.jpg) |
| Quick comparison | Desktop, 1440 × 1000 | [comparison-desktop.jpg](screenshots/comparison-desktop.jpg) |
| Running Basics | Desktop, 1440 × 1000 | [running-basics-desktop.jpg](screenshots/running-basics-desktop.jpg) |
| Catalogue | Tablet, 768 × 1024 | [catalogue-tablet.jpg](screenshots/catalogue-tablet.jpg) |
| Catalogue | Phone, 390 × 844 | [catalogue-phone.jpg](screenshots/catalogue-phone.jpg) |
| Running Basics | Phone, 390 × 844 | [running-basics-phone.jpg](screenshots/running-basics-phone.jpg) |
| Dark catalogue | Desktop, 1440 × 1000 | [catalogue-dark-desktop.jpg](screenshots/catalogue-dark-desktop.jpg) |
| Dark catalogue | Tablet, 768 × 1024 | [catalogue-dark-tablet.jpg](screenshots/catalogue-dark-tablet.jpg) |
| Dark catalogue | Phone, 390 × 844 | [catalogue-dark-phone.jpg](screenshots/catalogue-dark-phone.jpg) |

## Visual characteristics to preserve

- a distinct RunDecoded identity and compact primary navigation;
- a content-first card hierarchy with product imagery, purpose, and three quick specifications;
- one-column phone, two-column tablet, and three-column desktop catalogue layouts where space permits;
- details and comparison shown as focused overlays;
- a sticky desktop topic index and compact mobile topic selector;
- full light and dark themes with readable state colours.

## Characteristics that may change

- exact spacing, typography, gradients, shadows, and breakpoints;
- component structure and modal dimensions;
- visual treatment of filters, category tags, and comparison differences;
- image aspect-ratio implementation, provided the product remains centred and uncropped.

Later visual regression tests should capture the same state-and-viewport matrix.
