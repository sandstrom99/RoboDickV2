# 🔒 Security Guide for RoboDickV2

## Overview
This document outlines the security measures implemented in RoboDickV2 for safe public hosting.

## 🛡️ Implemented Security Features

### **1. Rate Limiting**
- **General API**: 100 requests per 15 minutes per IP
- **File Uploads**: 20 uploads per hour per IP  
- **Authentication**: 5 attempts per 15 minutes per IP
- **Protection**: Prevents brute force and DoS attacks

### **2. Enhanced CORS**
- **Development**: Allows local network access
- **Production**: Whitelist specific domains only
- **Methods**: Limited to GET, POST, DELETE, OPTIONS
- **Headers**: Restricted to essential headers only

### **3. Security Headers (Helmet.js)**
- **Content Security Policy**: Prevents XSS attacks
- **HSTS**: Forces HTTPS connections
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing
- **Referrer Policy**: Controls referrer information

### **4. File Upload Security**
- **File Type Validation**: Images only
- **Size Limits**: 10MB maximum
- **Filename Sanitization**: UUID-based naming
- **Path Traversal Protection**: Secure storage location

### **5. Input Validation**
- **Request Size Limits**: 10MB JSON/form data
- **Parameter Validation**: Type checking on all inputs
- **Error Handling**: No sensitive information leaked

## 🌐 Cloudflare Tunnel Benefits

### **Zero Attack Surface**
- **No open ports** on your Mac mini
- **No port forwarding** required
- **No direct IP exposure**

### **Built-in Protection**
- **DDoS mitigation** (Enterprise-grade)
- **Bot protection** and filtering
- **SSL/TLS termination** with auto-renewal
- **Geographic filtering** options

### **Access Control**
- **IP whitelisting** capabilities
- **Cloudflare Access** integration
- **Custom authentication** rules

## 🔐 Environment Security

### **Development vs Production**
```bash
# Development (.env)
NODE_ENV=development
PORTAL_DOMAIN=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173

# Production (.env.production)  
NODE_ENV=production
PORTAL_DOMAIN=https://portal.yourdomain.com
ALLOWED_ORIGINS=https://portal.yourdomain.com
```

### **Sensitive Data Protection**
- **Environment variables** for all secrets
- **No hardcoded credentials** in source code
- **Different configs** per environment

## 🚨 Security Monitoring

### **Built-in Logging**
- **Rate limit violations** logged with IP
- **Failed authentication** attempts tracked
- **Upload attempts** monitored
- **Error patterns** identified

### **Health Checks**
- **Service status** endpoint: `/health`
- **Dependency checking** for database/external services
- **Performance metrics** available

## 🔧 Recommended Additional Security

### **1. Fail2Ban (Optional)**
Monitor logs and auto-ban malicious IPs:
```bash
# Example fail2ban rule for repeated violations
sudo fail2ban-client set robodick banip 192.168.1.100
```

### **2. Monitoring & Alerts**
- **Uptime monitoring** (UptimeRobot, etc.)
- **Error tracking** (Sentry integration ready)
- **Performance monitoring** (New Relic, DataDog)

### **3. Backup Security**
- **Encrypted backups** of image data
- **Secure metadata** storage
- **Regular security updates**

## 🚀 Deployment Checklist

### **Before Going Live:**
- [ ] Change default passwords
- [ ] Set strong environment variables
- [ ] Configure production CORS origins  
- [ ] Set up Cloudflare Tunnel
- [ ] Test rate limiting
- [ ] Verify HTTPS-only access
- [ ] Enable monitoring
- [ ] Document incident response

### **Regular Maintenance:**
- [ ] Update dependencies monthly
- [ ] Review access logs weekly
- [ ] Rotate secrets quarterly
- [ ] Security audit annually

## 🆘 Incident Response

### **If Compromise Suspected:**
1. **Immediate**: Disable Cloudflare Tunnel
2. **Assess**: Check logs for unauthorized access
3. **Secure**: Rotate all passwords/secrets
4. **Monitor**: Watch for continued attempts
5. **Recover**: Restore from clean backups if needed

### **Emergency Contacts:**
- Cloudflare Support: [support.cloudflare.com]
- Mac mini physical access: [your contact]

## 📞 Security Updates

This document should be reviewed and updated with each major release or security enhancement.

Last updated: [Current Date]
Security version: 1.0 