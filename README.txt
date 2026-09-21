IEEE AFRICON 2027 WordPress Theme
================================

Installation
------------
1. In WordPress, open Appearance > Themes > Add New > Upload Theme.
2. Upload ieee-africon-2027.zip and activate it.
3. The theme creates the required pages and assigns Home as the static front page.

The original HTML files remain the design source so the installed site retains
the supplied layout, typography, imagery, responsive styling, and JavaScript.

Launch gates
------------
The public launch date must be agreed with the AFRICON Steering Committee and
IEEE Region 8 after these owner decisions are recorded:
1. Approve final registration fees, IEEE member differentials, taxes, refund
   deadlines, banking entity and online card processor.
2. Confirm whether virtual participation is offered and publish its author and
   attendee rules.
3. Confirm official hotel room blocks, rates, booking deadlines and cancellation
   conditions, or retain the independent-accommodation disclaimer.
4. Verify every committee affiliation/country, broaden Region 8 TPC membership,
   and confirm the Finance Chair appointment against the Senior Member rule.
5. Confirm any 2027 travel-support calls before advertising funding.
6. Configure and test outbound mail for form-handler.php on the production host.
   Set AFRICON_CONTACT_EMAIL and AFRICON_REGISTRATION_EMAIL, or verify the
   WordPress administrator email used as the fallback recipient.

After editing an HTML source, run:
  node tools/build-wordpress-page-templates.js

This rebuilds the matching WordPress TXT templates, including the homepage and
Travel Support page.
