# FreeSWITCH Troubleshooting Guide

## Issue: mod_sofia Crash on Production Server

**Server:** 93.93.113.13  
**Error:** `mod_sofia` module crashes on startup  
**Impact:** SIP registration and calls not working  

---

## Diagnosis Steps

1. **Check FreeSWITCH Logs:**
   ```bash
   sudo tail -f /var/log/freeswitch/freeswitch.log
   ```

2. **Check Module Status:**
   ```bash
   fs_cli -x "module_exists mod_sofia"
   fs_cli -x "sofia status"
   ```

3. **Verify Dependencies:**
   ```bash
   ldd /usr/lib/freeswitch/mod/mod_sofia.so
   ```

---

## Solution Options

### Option 1: Reinstall FreeSWITCH (Recommended)

```bash
# Backup configuration
sudo cp -r /etc/freeswitch /etc/freeswitch.backup.$(date +%Y%m%d)

# Remove existing installation
sudo apt remove --purge freeswitch freeswitch-all
sudo apt autoremove

# Add FreeSWITCH repository
wget -O - https://files.freeswitch.org/repo/deb/debian-release/fsstretch-archive-keyring.asc | sudo apt-key add -
echo "deb https://files.freeswitch.org/repo/deb/debian-release/ $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/freeswitch.list

# Install FreeSWITCH with mod_sofia
sudo apt update
sudo apt install -y freeswitch-all freeswitch-mod-sofia

# Restore configuration
sudo rsync -av /etc/freeswitch.backup.*/ /etc/freeswitch/

# Start FreeSWITCH
sudo systemctl start freeswitch
sudo systemctl status freeswitch
```

### Option 2: Recompile mod_sofia from Source

```bash
# Install build dependencies
sudo apt install -y build-essential autoconf automake libtool pkg-config
sudo apt install -y libsofia-sip-ua-dev libsofia-sip-ua-glib-dev

# Navigate to FreeSWITCH source (if available)
cd /usr/src/freeswitch

# Rebuild mod_sofia
make mod_sofia-clean
make mod_sofia
sudo make mod_sofia-install

# Restart FreeSWITCH
sudo systemctl restart freeswitch
```

### Option 3: Check Missing Libraries

```bash
# Find missing dependencies
ldd /usr/lib/freeswitch/mod/mod_sofia.so | grep "not found"

# Install missing libraries (example)
sudo apt install -y libsofia-sip-ua0
```

---

## Verification

After applying the fix:

1. **Check mod_sofia loads:**
   ```bash
   fs_cli -x "module_exists mod_sofia"
   # Should return: true
   ```

2. **Check SIP profiles:**
   ```bash
   fs_cli -x "sofia status"
   # Should show profiles running
   ```

3. **Test SIP registration from extension 100:**
   - Configure SIP client with:
     - Domain: `demo.edgvoip.it`
     - Username: `100`
     - Password: `DemoExt100Pass!`
     - Server: `93.93.113.13`

4. **Check FreeSWITCH XML provisioning:**
   ```bash
   curl -X POST "http://localhost:3001/api/freeswitch/xml" \
     -d "section=directory&key_value=demo.edgvoip.it&user=100"
   ```

---

## Prevention

1. **Never edit files directly on production**  
   Use Git workflow: `Replit dev` → `Git push` → `Server pull`

2. **Document all changes in DEPLOYMENT.md**

3. **Test on Replit dev environment first**

4. **Keep FreeSWITCH and dependencies updated:**
   ```bash
   sudo apt update
   sudo apt upgrade freeswitch-all
   ```

---

## Related Files

- XML Provisioning: `packages/backend/src/services/freeswitch-xml.service.ts`
- FreeSWITCH Routes: `packages/backend/src/routes/freeswitch-xml.routes.ts`
- Deployment Guide: `DEPLOYMENT.md`

---

## Contact

For issues, check:
- FreeSWITCH Logs: `/var/log/freeswitch/`
- Application Logs: Backend server console
- Database: Verify tenant and extension data
