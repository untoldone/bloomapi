Common tasks for API Tool
========================

Steps to grant access to YourChart / Patient Records API:

1. Get email for BloomAPI user account
2. Lookup API Key using email
  * SSH to root@db-02.bloomapi.com
  * Run psql on bloomdb: `su postgres -c "psql bloomapi"`
  * Run a lookup query: 

```    
SELECT key
FROM accounts
JOIN api_keys ON accounts.id = api_keys.account_id
WHERE accounts.username ILIKE '<replace with email>';
```

3. With API key, grant access to MyChart location API and YourChart API
  * SSH to root@worker-01.bloomapi.com
  * Run `/root/api_keys_linux_amd64 associate <api_key> bloomapi.epic.mychart_locations` to grant access to locations
  * Run `/root/api_keys_linux_amd64 grant-yourchart <api_key>` to grant access to YourChart
