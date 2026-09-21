IEEE AFRICON 2027 - WordPress page templates
================================================

Each TXT file is ready to paste into the WordPress page's Text/Classic editor,
the same way as the supplied homepage template. Replace the page's old content
with the complete matching TXT file, then update/publish it. Do not paste it
through the Visual editor, which may alter shortcode markup.

Required WordPress page slugs:
- About IEEE AFRICON 2027: /about/
- Home: /
- Authors: /authors/
- Committees: /committees/
- Contact Us: /contact-us/
- Technical Program: /program/
- Registration: /registration/
- Speakers: /speakers/
- Sponsors & Exhibitors: /sponsors/
- Travel Support: /travel-support/
- Venue & Travel: /venue/

Notes:
- The templates use WPBakery/Visual Composer shortcodes already used by Home.
- CSS and JavaScript are Base64-encoded inside WPBakery vc_raw_html blocks so
  WordPress does not strip the tags and display the code as visible page text.
- Contact and Registration markup is also Base64-encoded because WordPress
  otherwise strips required form controls from ordinary text blocks.
- Shared layout styling is included in each template, so no theme installation
  or additional stylesheet is required.
- Registration retains its interactive multi-step form and submits to
  /form-handler.php. Deploy that endpoint at the WordPress web root and
  configure WordPress/PHP outbound mail before enabling public registration.
  Set AFRICON_CONTACT_EMAIL and AFRICON_REGISTRATION_EMAIL, or verify the
  WordPress administrator email used as the fallback recipient.
- Payments are intentionally not collected until the processor, banking,
  rates, tax and refund arrangements are approved by IEEE Region 8.
- Re-run `node tools/build-wordpress-page-templates.js` after editing a source
  HTML page to rebuild all templates.

WordPress global footer
-----------------------
The IEEE DCI theme footer is outside page-template content. Configure its menu
with these current official destinations so the old theme defaults do not
remain on the published site:
- Sitemap: https://www.ieee.org/sitemap.html
- Accessibility: https://www.ieee.org/accessibility-statement.html
- Nondiscrimination: https://www.ieee.org/about/corporate/governance/p9-26.html
- Event Terms: https://events.ieee.org/planning-basics/event-registration/policies-terms-conditions/
- Event Conduct & Safety: https://events.ieee.org/planning-basics/general-guidelines/ieee-event-conduct-and-safety-statement-for-conferences/
- Privacy: https://www.ieee.org/security/privacy-policy.html
- Contact: https://www.ieee.org/about/contact.html
- LinkedIn: https://www.linkedin.com/company/ieee-africon
