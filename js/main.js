/*
 * Filengro.in - Core JavaScript
 * Brand: Filengro
 * Description: Shared scripts for sticky header, mobile menu, scroll effects, and forms.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Sticky Header logic
  const header = document.querySelector('.header');
  const handleScroll = () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', handleScroll);
  handleScroll(); // Initial check

  // Mobile Menu Toggle
  const menuToggle = document.getElementById('menuToggle');
  const navMenu = document.getElementById('navMenu');

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      menuToggle.classList.toggle('active');
      navMenu.classList.toggle('active');
    });

    // Close menu when clicking outside or on a link
    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
        menuToggle.classList.remove('active');
        navMenu.classList.remove('active');
      }
    });

    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        navMenu.classList.remove('active');
      });
    });
  }

  // Set Active Nav Link based on URL
  const currentPath = window.location.pathname;
  const pageName = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    const linkPath = link.getAttribute('href');
    if (linkPath === pageName || (pageName === 'index.html' && linkPath === '/')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Floating WhatsApp Support Click
  const whatsappFloat = document.getElementById('whatsappFloat');
  if (whatsappFloat) {
    whatsappFloat.addEventListener('click', (e) => {
      e.preventDefault();
      const message = encodeURIComponent("Hello Filengro Team, I would like to inquire about your compliance and licensing services.");
      const whatsappNumber = "918392054791"; // A sample Indian phone number for demonstration
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
      window.open(whatsappUrl, '_blank');
    });
  }

  // Counter animation helper
  const counters = document.querySelectorAll('.counter');
  if (counters.length > 0) {
    const runCounter = () => {
      counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        const count = +counter.innerText.replace(/[^\d]/g, '');
        const speed = 200; // lower is faster
        const increment = target / speed;

        const updateCount = () => {
          const current = +counter.innerText.replace(/[^\d]/g, '');
          if (current < target) {
            counter.innerText = Math.ceil(current + increment) + '+';
            setTimeout(updateCount, 1);
          } else {
            counter.innerText = target + '+';
          }
        };
        updateCount();
      });
    };

    // Intersection Observer for counter trigger
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          runCounter();
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    observer.observe(document.querySelector('.hero-stats') || document.querySelector('.section'));
  }

  // Smooth appearance of elements
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const animObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = 1;
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const animatedElements = document.querySelectorAll('.fade-in-section');
  animatedElements.forEach(el => {
    el.style.opacity = 0;
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    animObserver.observe(el);
  });

  // -------------------------------------------------------------
  // Google Forms Integration — Single Unified Form
  // -------------------------------------------------------------
  // All service pages use the same mainContactForm config.
  // To connect to Google Forms:
  //  1. Create ONE Google Form with these fields:
  //     - Full Name        (Short answer)
  //     - Mobile Number    (Short answer)
  //     - Email Address    (Short answer)
  //     - Service Required (Dropdown — match the option values below)
  //     - Message          (Paragraph)
  //     - Source Page      (Short answer — hidden, auto-filled by JS)
  //  2. Get the form action URL and entry IDs, then replace the placeholders below.

  const googleFormConfigs = {
    mainContactForm: {
      url: 'https://docs.google.com/forms/u/0/d/e/1FAIpQLScYBaRcvSECZ6k9Bk4xDXTrWPw6Nf7GyqDqoTLbt-MmS9fidA/formResponse',
      fields: {
        cName:    'entry.24849636',   // Amit Kumar(Name)
        cPhone:   'entry.1518511015',  // 9999999999(mobile Number)
        cEmail:   'entry.1623228092',  // demo@gmail.com(Email)
        cService: 'entry.1952537698',  // GST Registration & Filing (service Required)
        cState:   'entry.1712544153',  // West Bengal(State)
        cMsg:     'entry.254635312'    // i want to contact you(Message)
      },
      success: 'Thank you for contacting Filengro! Your consultation request has been received. Our advisor will call you within 2 hours.'
    },
    partnerForm: {
      url: 'https://docs.google.com/forms/u/0/d/e/1FAIpQLSdUZkvu_e9n8Tkd3NvXpl-HMaCRzOiO21hAvTBzEw82ziQ7kw/formResponse',
      fields: {
        pName:        'entry.1376015383', // Applicant / Firm Name
        pMobile:      'entry.45699523',   // Mobile Number
        pEmail:       'entry.67453571',   // Email Address
        pDesignation: 'entry.1533263178', // Professional Role
        pExperience:  'entry.540827060',  // Years of Practice
        pExpertise:   'entry.885909379',  // Primary Area of Expertise
        pState:       'entry.1050148396', // State field entry ID
        pMsg:         'entry.2007033859'  // Professional Details / Practice City
      },
      success: 'Thank you for your interest! Your partnership application has been submitted successfully. Our team will review your profile and contact you within 24 hours.'
    }
  };

  // Auto-select service dropdown based on data-service attribute on the form
  // Works for all service pages automatically.
  document.querySelectorAll('form[data-service]').forEach(form => {
    const serviceValue = form.getAttribute('data-service');
    const select = form.querySelector('#cService');
    if (select && serviceValue) {
      select.value = serviceValue;
    }
  });

  // Wire up ALL forms that match any key in googleFormConfigs
  Object.keys(googleFormConfigs).forEach(formId => {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const config = googleFormConfigs[formId];

      // If placeholder URL not yet replaced, show mock success
      if (config.url.includes('YOUR_FORM_ID_HERE') || config.url.includes('YOUR_PARTNER_FORM_ID_HERE')) {
        console.warn('Google Form not configured yet — showing mock response for: ' + formId);
        alert(config.success);
        form.reset();
        return;
      }

      const formData = new URLSearchParams();
      Object.keys(config.fields).forEach(fieldId => {
        const element = form.querySelector('#' + fieldId) || document.getElementById(fieldId);
        if (element) {
          let val = element.value;
          // Send display text for dropdowns to match Google Form validation options exactly
          if (element.tagName === 'SELECT' && element.selectedIndex >= 0) {
            val = element.options[element.selectedIndex].text;
            
            // Normalize service names to match Google Form strict options (Client Form)
            if (element.id === 'cService') {
              const serviceMapping = {
                'Company / LLP Incorporation': 'Company/LLP Incorporation',
                'Import Export Code (IEC)': 'Import Export Code(IEC)',
                'MSME / Udyam Registration': 'MSME/Udyam Registration',
                'Digital Signature (DSC)': 'Digital Signature(DSC)',
                'General Consulting / Other': 'General Consulting/Other'
              };
              if (serviceMapping[val]) {
                val = serviceMapping[val];
              }
            }
            
            // Normalize designation names to match Google Form strict options (Partner Form)
            if (element.id === 'pDesignation') {
              const designationMapping = {
                'Chartered Accountant (CA)': 'Chartered Accountant(CA)',
                'Company Secretary (CS)': 'Company Secretary(CS)',
                'Cost Management Accountant (CMA)': 'Cost Management Accountant(CMA)',
                'Advocate / Legal Consultant': 'Advocate/Legal Consultant',
                'Compliance / ISO Auditor': 'Compliance/ISO Auditor'
              };
              if (designationMapping[val]) {
                val = designationMapping[val];
              }
            }
            
            // Normalize state names to match Google Form strict options
            if (element.id === 'cState' || element.id === 'pState') {
              if (val === 'Delhi (UT)') {
                val = 'Delhi(UT)';
              }
            }
          }
          formData.append(config.fields[fieldId], val);
        }
      });

      fetch(config.url, {
        method: 'POST',
        mode: 'no-cors',
        body: formData,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
      .then(() => {
        alert(config.success);
        form.reset();
        // Re-apply service pre-selection after reset (for client forms)
        const serviceValue = form.getAttribute('data-service');
        const select = form.querySelector('#cService');
        if (select && serviceValue) select.value = serviceValue;
      })
      .catch(error => {
        console.error('Submission error:', error);
        alert('There was a technical issue. Please try again or contact us via WhatsApp.');
      });
    });
  });



  // Back to Top functionality
  const backToTopBtn = document.getElementById('backToTop');
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        backToTopBtn.classList.add('show');
      } else {
        backToTopBtn.classList.remove('show');
      }
    });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // -------------------------------------------------------------
  // Mobile Number Inputs Validation & Restriction
  // -------------------------------------------------------------
  // Enforces only numbers (0-9) and exactly 10 digits.
  const restrictMobileInput = (selector) => {
    const inputs = document.querySelectorAll(selector);
    inputs.forEach(input => {
      // Dynamic input listener to instantly strip non-numeric entries
      input.addEventListener('input', (e) => {
        const cleaned = e.target.value.replace(/\D/g, '');
        e.target.value = cleaned.slice(0, 10);
      });
      // HTML5 Form Validation attributes
      input.setAttribute('type', 'tel');
      input.setAttribute('pattern', '[0-9]{10}');
      input.setAttribute('maxlength', '10');
      input.setAttribute('minlength', '10');
      input.setAttribute('title', 'Please enter a valid 10-digit mobile number (e.g. 9876543210)');
    });
  };

  restrictMobileInput('#cPhone');  // Client Form phone inputs
  restrictMobileInput('#pMobile'); // Partner Form phone inputs
});
