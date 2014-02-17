0.1.3 / 2014-02-08
==================

  * Fixed Error with certain NPI TypeError: Cannot set property taxonomy of undefined
  * Updated README.md
  * Updated ansible deployment code to have timeout on long bootstrap ops as well as updated for latested version of ansible

0.1.2 / 2013-09-28
==================

  * Added nginx logging for request/response time + logging of x-forwarded-for to capture source ips when behind a load balancer
  * Added error messages if trying to re-bootstrap bootstrapped deployment
  * Fixed search code that crashed bloomAPI if searching for a string in a field whose column was typed as an number in postgres
  * Fixed website search to allow for spaces in names of cities
  * Fixed npi.yml typo meicare => medicare
  * Fixed GA tracking code to track full url before and after hash-mark

0.1.1 / 2013-09-17
==================

  * Added 404 page for website
  * Added optimized postgres configuration for deployment
  * Added site metadata
  * Added index and enum documentation
  * Added Google Analytics tracking of search subpages after hash
  * Changed Google Analytics configuration so production id not checked in
  * Fixed field provider_business_practice_location_address_country_code_if_out to map to practice_address.country_code
  * Fixed can now browse directly to www.bloomapi.com/search

0.1.0 / 2013-09-01
==================

  * Initial release
