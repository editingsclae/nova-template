/* Static content pages linked from the footer Support column.
   Inline markup: **bold** and [label](/href). */

export const PAGES = {
  contact: {
    title: 'Contact Us',
    head: 'Contact Us – Nova Shoes',
    blocks: [
      { p: '**We’re Here to Help!**' },
      { p: 'Welcome to Nova Shoes. Your satisfaction is our priority! Whether you have questions about our products, need help with an order, or require technical assistance, our team is ready to help.' },
      { h: 'Get in Touch' },
      {
        ul: [
          '**Store Name:** Nova Shoes',
          '**Location:** Tunisia',
          '**Email:** [nova@store.com](mailto:nova@store.com)',
          '**Phone / WhatsApp:** [24675223](tel:+21624675223)',
          '**Facebook:** Nova',
          '**Instagram:** Nova'
        ]
      },
      { h: 'Customer Support' },
      { p: 'Our customer service team can assist you with:' },
      {
        ul: [
          'Product information and availability.',
          'Orders and delivery inquiries.',
          'Payment methods.',
          'Returns and exchanges.',
          'Warranty and after-sales support.',
          'Technical assistance.'
        ]
      },
      { h: 'Business Hours' },
      { lines: ['Monday – Saturday: 9:00 AM – 6:00 PM', 'Sunday: Closed'] },
      { h: 'Send Us a Message' },
      { p: 'Have a question or need assistance? Contact us by phone, WhatsApp, or email. We’ll do our best to respond as quickly as possible.' },
      { p: '**Nova Shoes – Your Trusted Footwear Shopping Destination in Tunisia.**' },
      { p: 'Thank you for choosing Nova Shoes!' }
    ]
  },

  shipping: {
    title: 'Shipping',
    head: 'Shipping & Delivery Policy',
    blocks: [
      { p: 'At **Nova Shoes**, we are committed to delivering your orders safely, quickly, and conveniently throughout Tunisia.' },
      { h: '1. Delivery Coverage' },
      { p: 'We offer delivery services across Tunisia, including major cities and regions.' },
      { h: '2. Delivery Time' },
      { ul: ['Greater Tunis: 1–2 business days.', 'Other governorates: 2–3 business days.'] },
      { p: 'Delivery times are estimates and may vary depending on your location and order availability.' },
      { h: '3. Shipping Fees' },
      { p: 'Shipping fees are calculated according to the delivery location and will be communicated or displayed during checkout.' },
      { h: '4. Order Processing' },
      { p: 'Orders are processed as quickly as possible after confirmation. Our team may contact you by phone to confirm your order and delivery details.' },
      { h: '5. Cash on Delivery' },
      { p: 'We offer Cash on Delivery (COD), allowing you to pay for your order when it arrives at your doorstep, subject to availability.' },
      { h: '6. Tracking Your Order' },
      { p: 'For information about your shipment, please contact our customer support team with your order number.' },
      { h: '7. Delayed Deliveries' },
      { p: 'Although we do our best to meet estimated delivery times, delays may occasionally occur due to weather conditions, holidays, or courier-related issues.' },
      { h: '8. Incorrect Delivery Information' },
      { p: 'Please ensure that your name, phone number, and delivery address are correct when placing your order.' },
      { h: '9. Contact Us' },
      { p: 'If you have any questions about shipping or delivery, contact us:' },
      {
        lines: [
          '**Nova Shoes**',
          'Tunisia',
          'Email: [nova@store.com](mailto:nova@store.com)',
          'Phone / WhatsApp: [24675223](tel:+21624675223)'
        ]
      },
      { p: '**Nova Shoes – Footwear Delivered to Your Door!**' }
    ]
  },

  returns: {
    title: 'Returns',
    head: 'Returns & Refunds Policy',
    blocks: [
      { p: 'At **Nova Shoes**, customer satisfaction is our priority. We want you to shop with confidence. If you experience a problem with your purchase, we’re here to help.' },
      { h: '1. Return Period' },
      { p: 'Customers may request a return within 7 days of receiving their order, subject to applicable Tunisian consumer protection laws and the conditions below.' },
      { h: '2. Return Conditions' },
      { p: 'To be eligible for a return:' },
      {
        ul: [
          'The product must be unused and in its original condition.',
          'The product must be returned with its original packaging and accessories.',
          'All included manuals, cables, and accessories must be returned.',
          'Proof of purchase or order confirmation must be provided.'
        ]
      },
      { h: '3. Damaged or Defective Products' },
      { p: 'If you receive a damaged, defective, or incorrect product, please contact us as soon as possible.' },
      { p: 'Please provide:' },
      { ul: ['Your order number.', 'A description of the problem.', 'Photos or videos showing the issue, if applicable.'] },
      { p: 'We will review your request and offer an appropriate solution.' },
      { h: '4. Non-Returnable Products' },
      { p: 'Certain products may not be eligible for return, including:' },
      {
        ul: [
          'Products damaged due to misuse or accidental damage.',
          'Products with missing accessories or components.',
          'Products damaged after delivery due to improper handling.',
          'Products excluded from returns under applicable law.'
        ]
      },
      { p: 'Nothing in this policy limits your mandatory legal rights.' },
      { h: '5. Refunds' },
      { p: 'Once your returned product has been inspected and approved, we will contact you regarding the refund process.' },
      { p: 'Refunds will be issued using an agreed payment method, in accordance with applicable law.' },
      { h: '6. Exchanges' },
      { p: 'If your product is defective or you receive the wrong item, we will work with you to arrange a replacement, subject to product availability.' },
      { h: '7. Return Shipping Costs' },
      { p: 'For defective, damaged, or incorrectly delivered products, Nova Shoes will arrange an appropriate return solution.' },
      { p: 'For other eligible returns, shipping costs will be communicated before the return is arranged, subject to applicable law.' },
      { h: '8. How to Request a Return' },
      { p: 'To request a return or exchange, contact our customer support team:' },
      {
        ul: [
          '**Store:** Nova Shoes',
          '**Email:** [nova@store.com](mailto:nova@store.com)',
          '**Phone / WhatsApp:** [24675223](tel:+21624675223)',
          '**Location:** Tunisia'
        ]
      },
      { p: 'Please include your order number and the reason for your return.' },
      { h: '9. Our Commitment' },
      { p: 'At Nova Shoes, we believe in quality products, reliable service, and happy customers.' },
      { p: 'Thank you for shopping with Nova Shoes!' },
      { p: '**Nova Shoes – Your Trusted Footwear Shopping Destination in Tunisia.**' }
    ]
  },

  privacy: {
    title: 'Privacy Policy',
    head: 'Privacy Policy – Nova Shoes',
    blocks: [
      { p: '**Last Updated: November 2026**' },
      { p: 'At Nova Shoes, we respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and protect your information when you visit our website or make a purchase.' },
      { h: '1. Information We Collect' },
      { p: 'When you use our website or place an order, we may collect the following information:' },
      {
        ul: [
          'Full name.',
          'Phone number.',
          'Email address.',
          'Delivery address and city.',
          'Order details and purchase history.',
          'Information you voluntarily provide when contacting customer support.'
        ]
      },
      { h: '2. How We Use Your Information' },
      { p: 'We use your personal information to:' },
      {
        ul: [
          'Process and confirm your orders.',
          'Arrange shipping and delivery.',
          'Contact you about your purchases.',
          'Provide customer support.',
          'Process returns and exchanges.',
          'Improve our website and shopping experience.',
          'Prevent fraudulent transactions and misuse of our services.'
        ]
      },
      { h: '3. Information Protection' },
      { p: 'We take reasonable technical and organizational measures to protect your personal information against unauthorized access, loss, misuse, or disclosure.' },
      { p: 'However, no online transmission or electronic storage system can be guaranteed to be completely secure.' },
      { h: '4. Sharing Your Information' },
      { p: 'Nova Shoes does not sell your personal information.' },
      { p: 'We may share necessary information with trusted third parties when required to operate our business, including:' },
      {
        ul: [
          'Delivery and shipping companies.',
          'Payment service providers.',
          'Website hosting and technical service providers.',
          'Public authorities when required by law.'
        ]
      },
      { p: 'These parties should only receive the information necessary to perform their services.' },
      { h: '5. Cookies' },
      { p: 'Our website may use cookies and similar technologies to:' },
      { ul: ['Improve website performance.', 'Remember your preferences.', 'Understand website traffic.', 'Improve your shopping experience.'] },
      { p: 'You can manage or disable cookies through your browser settings.' },
      { h: '6. Data Retention' },
      { p: 'We retain personal information only for as long as necessary to fulfill the purposes described in this policy, meet legal obligations, resolve disputes, and protect our business interests.' },
      { h: '7. Your Privacy Rights' },
      { p: 'Subject to applicable Tunisian data protection laws, you may have the right to:' },
      {
        ul: [
          'Request access to your personal information.',
          'Request correction of inaccurate information.',
          'Request deletion where legally permitted.',
          'Object to certain uses of your personal information.',
          'Ask questions about how your data is processed.'
        ]
      },
      { h: '8. Third-Party Websites' },
      { p: 'Our website may contain links to third-party websites or services. Nova Shoes is not responsible for the privacy practices of external websites.' },
      { p: 'We encourage customers to review their privacy policies before providing personal information.' },
      { h: '9. Children’s Privacy' },
      { p: 'Our website is not intended to collect personal information directly from children without the appropriate authorization required by applicable law.' },
      { h: '10. Changes to This Privacy Policy' },
      { p: 'Nova Shoes reserves the right to update this Privacy Policy when necessary. Any changes will be published on this page with an updated revision date.' },
      { h: '11. Contact Us' },
      { p: 'If you have questions or requests regarding this Privacy Policy, please contact us:' },
      {
        lines: [
          '**Nova Shoes**',
          'Location: Tunisia',
          'Email: [nova@store.com](mailto:nova@store.com)',
          'Phone / WhatsApp: [24675223](tel:+21624675223)'
        ]
      },
      { p: 'We value your trust and are committed to protecting your privacy.' },
      { p: '**Nova Shoes – Your Trusted Footwear Shopping Destination in Tunisia.**' }
    ]
  },

  terms: {
    title: 'Terms of Service',
    head: 'Terms of Service – Nova Shoes',
    blocks: [
      { p: '**Last Updated: November 2026**' },
      { p: 'Welcome to Nova Shoes. These Terms of Service govern your access to and use of our website and services. By visiting our website or placing an order, you agree to these terms.' },
      { p: 'Please read them carefully before using our services.' },
      { h: '1. General Information' },
      { p: 'Nova Shoes is an ecommerce store based in Tunisia, specializing in the sale of footwear and related products.' },
      { p: 'Throughout these terms, "we", "us", and "our" refer to Nova Shoes. "You" and "your" refer to our customers and website visitors.' },
      { h: '2. Products and Availability' },
      {
        ul: [
          'We make every effort to display accurate product descriptions, images, and prices.',
          'Product availability may change without prior notice.',
          'Product images are for illustration purposes and may differ slightly from the actual product.',
          'We reserve the right to discontinue products at any time.'
        ]
      },
      { h: '3. Prices and Payments' },
      {
        ul: [
          'All prices are displayed in Tunisian Dinars (TND), unless otherwise indicated.',
          'Prices may change without prior notice.',
          'Available payment methods will be communicated during checkout.',
          'Cash on Delivery may be available depending on the delivery location and order conditions.',
          'Orders are subject to confirmation.'
        ]
      },
      { h: '4. Orders and Confirmation' },
      { p: 'When placing an order, you agree to provide accurate and complete information.' },
      { p: 'We reserve the right to contact you to confirm your order.' },
      { p: 'We may refuse or cancel an order in cases such as:' },
      {
        ul: [
          'Incorrect pricing or product information.',
          'Product unavailability.',
          'Incorrect customer information.',
          'Suspected fraudulent or unauthorized activity.'
        ]
      },
      { p: 'If an order is cancelled after payment, any refund due will be handled in accordance with applicable law.' },
      { h: '5. Shipping and Delivery' },
      { p: 'We aim to deliver orders throughout Tunisia as efficiently as possible.' },
      {
        ul: [
          'Delivery times are estimates and may vary by location.',
          'Delivery charges will be communicated during checkout.',
          'Customers are responsible for providing accurate delivery information.',
          'Delays may occur due to circumstances beyond our control.'
        ]
      },
      { p: 'For more information, please refer to our [Shipping & Delivery Policy](/shipping).' },
      { h: '6. Returns and Refunds' },
      { p: 'We want our customers to be satisfied with their purchases.' },
      { p: 'Returns, exchanges, refunds, and warranty claims are handled according to our [Returns & Refunds Policy](/returns) and applicable Tunisian consumer protection laws.' },
      { p: 'Nothing in these terms limits your mandatory legal rights.' },
      { h: '7. Product Warranty' },
      { p: 'Products may be covered by manufacturer or seller warranties, depending on the product.' },
      { p: 'Warranty conditions, duration, and coverage will be communicated where applicable.' },
      { p: 'Damage caused by misuse, accidents, or unauthorized modifications may not be covered, subject to applicable law.' },
      { h: '8. Intellectual Property' },
      { p: 'All website content, including logos, text, graphics, product descriptions, and design elements, belongs to Nova Shoes or its respective rights holders.' },
      { p: 'You may not reproduce, distribute, or use our content for commercial purposes without prior authorization.' },
      { h: '9. User Responsibilities' },
      { p: 'By using our website, you agree not to:' },
      {
        ul: [
          'Provide false or misleading information.',
          'Use our website for illegal activities.',
          'Attempt to disrupt or damage website functionality.',
          'Interfere with the security of our services.',
          'Violate the rights of other users or third parties.'
        ]
      },
      { h: '10. Limitation of Liability' },
      { p: 'Nova Shoes will make reasonable efforts to ensure the accuracy and availability of its website and services.' },
      { p: 'To the extent permitted by applicable law, we are not responsible for indirect losses arising from temporary website interruptions or circumstances beyond our reasonable control.' },
      { p: 'Nothing in these terms excludes liability that cannot legally be excluded.' },
      { h: '11. Privacy' },
      { p: 'Your personal information is handled according to our [Privacy Policy](/privacy).' },
      { p: 'By using our website, you acknowledge that you have had the opportunity to review our [Privacy Policy](/privacy).' },
      { h: '12. Changes to These Terms' },
      { p: 'We reserve the right to update or modify these Terms of Service when necessary.' },
      { p: 'Changes will be published on this page with an updated revision date.' },
      { p: 'Continued use of our website after changes are published is subject to the revised terms, without affecting rights protected by applicable law.' },
      { h: '13. Applicable Law' },
      { p: 'These Terms of Service are governed by the applicable laws and regulations of Tunisia.' },
      { p: 'Any disputes will be handled by the competent Tunisian authorities and courts, as applicable.' },
      { h: '14. Contact Information' },
      { p: 'If you have questions about these Terms of Service, please contact us:' },
      {
        lines: [
          '**Nova Shoes**',
          'Location: Tunisia',
          'Email: [nova@store.com](mailto:nova@store.com)',
          'Phone / WhatsApp: [24675223](tel:+21624675223)'
        ]
      },
      { h: 'Thank You for Shopping With Us!' },
      { p: 'We appreciate your trust in Nova Shoes and look forward to providing you with a reliable and convenient online shopping experience.' },
      { p: '**Nova Shoes – Your Trusted Footwear Shopping Destination in Tunisia.**' }
    ]
  }
};

export const PAGE_SLUGS = Object.keys(PAGES);
