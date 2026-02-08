/**
 * main.js — Synth Data frontend
 * Backend integration (fetch), domain selector, GSAP + ScrollTrigger animations.
 * Hugging Face token is used on the backend; frontend sends prompt + domain only.
 * Placeholder below for optional future use (e.g. if API required token in header).
 */
(function () {
  'use strict';

  gsap.registerPlugin(ScrollTrigger);

  // -------------------------------------------------------------------------
  // Backend integration config
  // -------------------------------------------------------------------------
  var API_BASE_URL = 'http://localhost:5000';
  // Placeholder only: in production the backend uses HF_TOKEN from .env;
  // if your API ever requires the token in the request header, set it here (never commit real tokens).
  var HF_TOKEN_PLACEHOLDER = '';

  // -------------------------------------------------------------------------
  // DOM refs
  // -------------------------------------------------------------------------
  var hero = document.getElementById('hero');
  var heroTitleLine1 = document.querySelector('.hero__title-line--1');
  var heroTitleLine2 = document.querySelector('.hero__title-line--2');
  var heroTagline = document.querySelector('.hero__tagline');
  var nav = document.getElementById('nav');
  var promptSection = document.getElementById('prompt-section');
  var promptCard = document.getElementById('prompt-card');
  var promptTextarea = document.getElementById('dataset-prompt');
  var domainSelector = document.getElementById('domain-selector');
  var domainPills = document.querySelectorAll('.domain-pill');
  var btnGenerate = document.getElementById('btn-generate');
  var errorMessage = document.getElementById('error-message');
  var errorMessageText = document.getElementById('error-message-text');
  var previewWrapper = document.getElementById('preview-wrapper');
  var schemaList = document.getElementById('schema-list');
  var sampleThead = document.getElementById('sample-thead');
  var sampleTbody = document.getElementById('sample-tbody');
  var schemaCard = document.getElementById('schema-card');
  var sampleCard = document.getElementById('sample-card');
  var footer = document.getElementById('footer');
  var floatOrbs = document.querySelectorAll('.float-orb');

  // -------------------------------------------------------------------------
  // Hero entrance — staggered (each line + tagline)
  // -------------------------------------------------------------------------
  function initHeroAnimation() {
    if (!hero) return;

    var elements = [nav, heroTitleLine1, heroTitleLine2, heroTagline];
    gsap.set(elements, { opacity: 0, y: 28 });
    gsap.set(nav, { y: -16 });

    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.to(nav, { opacity: 1, y: 0, duration: 0.5 })
      .to(heroTitleLine1, { opacity: 1, y: 0, duration: 0.55 }, 0.15)
      .to(heroTitleLine2, { opacity: 1, y: 0, duration: 0.55 }, 0.32)
      .to(heroTagline, { opacity: 1, y: 0, duration: 0.55 }, 0.5);
  }

  // -------------------------------------------------------------------------
  // Floating motion on background orbs (subtle idle)
  // -------------------------------------------------------------------------
  function initFloatingOrbs() {
    if (!floatOrbs.length) return;
    floatOrbs.forEach(function (orb, i) {
      var amount = 10 + i * 4;
      gsap.to(orb, {
        marginTop: amount,
        duration: 4.5 + i,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
    });
  }

  // -------------------------------------------------------------------------
  // Parallax for orbs (scroll-driven)
  // -------------------------------------------------------------------------
  function initParallaxOrbs() {
    if (!floatOrbs.length) return;
    floatOrbs.forEach(function (orb, i) {
      var depth = 0.15 + (i * 0.08);
      ScrollTrigger.create({
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.5,
        onUpdate: function (self) {
          var y = self.progress * 120 * depth;
          if (orb.classList.contains('float-orb--3')) {
            orb.style.transform = 'translate(-50%, calc(-50% + ' + y + 'px))';
          } else {
            orb.style.transform = 'translateY(' + y + 'px)';
          }
        }
      });
    });
  }

  // -------------------------------------------------------------------------
  // Prompt card subtle idle animation
  // -------------------------------------------------------------------------
  function initPromptCardIdle() {
    if (!promptCard) return;
    gsap.to(promptCard, {
      y: 3,
      duration: 2.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }

  // -------------------------------------------------------------------------
  // ScrollTrigger: domain selector, preview cards, footer
  // -------------------------------------------------------------------------
  function initScrollReveals() {
    if (domainSelector) {
      gsap.set(domainSelector, { opacity: 0, y: 24 });
      ScrollTrigger.create({
        trigger: domainSelector,
        start: 'top 88%',
        once: true,
        onEnter: function () {
          gsap.to(domainSelector, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
        }
      });
    }
    if (schemaCard && sampleCard) {
      gsap.set([schemaCard, sampleCard], { opacity: 0, y: 32 });
      ScrollTrigger.create({
        trigger: previewWrapper,
        start: 'top 82%',
        once: true,
        onEnter: function () {
          if (!previewWrapper.classList.contains('is-hidden')) {
            gsap.to(schemaCard, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
            gsap.to(sampleCard, { opacity: 1, y: 0, duration: 0.5, delay: 0.12, ease: 'power2.out' });
          }
        }
      });
    }
    if (footer) {
      gsap.set(footer, { opacity: 0, y: 16 });
      ScrollTrigger.create({
        trigger: footer,
        start: 'top 92%',
        once: true,
        onEnter: function () {
          gsap.to(footer, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' });
        }
      });
    }
  }

  // -------------------------------------------------------------------------
  // Domain selector: pill click → set selected, send with request
  // -------------------------------------------------------------------------
  var selectedDomain = 'airline';
  function initDomainSelector() {
    if (!domainPills.length) return;
    domainPills.forEach(function (pill) {
      pill.addEventListener('click', function () {
        var domain = pill.getAttribute('data-domain');
        if (!domain) return;
        selectedDomain = domain;
        domainPills.forEach(function (p) {
          p.classList.remove('is-selected');
          p.setAttribute('aria-pressed', 'false');
        });
        pill.classList.add('is-selected');
        pill.setAttribute('aria-pressed', 'true');
      });
    });
  }

  // -------------------------------------------------------------------------
  // Normalize API response → { schema: [{name, type}], rows: [...] }
  // Backend may return: { schema, sample_rows } | { dataset } | HF-style [{ generated_text }]
  // -------------------------------------------------------------------------
  function inferSchemaFromRow(row) {
    var keys = Object.keys(row);
    return keys.map(function (k) {
      var v = row[k];
      var t = typeof v;
      if (t === 'number') t = Number.isInteger(v) ? 'integer' : 'float';
      else if (t === 'boolean') t = 'boolean';
      else t = 'string';
      return { name: k, type: t };
    });
  }

  function normalizeResponse(data) {
    // Case 1: backend already sends schema + rows
    if (data.schema && data.rows) {
      return { schema: data.schema, rows: data.rows };
    }
  
    // Case 2: backend sends only rows (mock backend)
    if (data.rows && Array.isArray(data.rows) && data.rows.length > 0) {
      return {
        schema: inferSchemaFromRow(data.rows[0]),
        rows: data.rows
      };
    }
  
    // Case 3: backend sends dataset array
    if (data.dataset && Array.isArray(data.dataset) && data.dataset.length > 0) {
      return {
        schema: inferSchemaFromRow(data.dataset[0]),
        rows: data.dataset
      };
    }
  
    return { schema: [], rows: [] };
  }
  

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function renderSchema(schema) {
    if (!schemaList || !schema || !schema.length) return;
    schemaList.innerHTML = schema.map(function (col) {
      return '<div class="schema-item">' +
        '<span class="schema-item__name">' + escapeHtml(col.name) + '</span>' +
        '<span class="schema-item__type">' + escapeHtml(col.type) + '</span></div>';
    }).join('');
  }

  function renderSampleTable(schema, rows) {
    if (!sampleThead || !sampleTbody || !schema || !rows) return;
    sampleThead.innerHTML = '<tr>' + schema.map(function (col) {
      return '<th>' + escapeHtml(col.name) + '</th>';
    }).join('') + '</tr>';
    sampleTbody.innerHTML = rows.map(function (row) {
      return '<tr>' + schema.map(function (col) {
        var val = row[col.name];
        if (typeof val === 'boolean') val = val ? 'true' : 'false';
        return '<td>' + escapeHtml(String(val)) + '</td>';
      }).join('') + '</tr>';
    }).join('');
  }

  function showError(msg) {
    if (!errorMessage || !errorMessageText) return;
    errorMessageText.textContent = msg || 'Something went wrong.';
    errorMessage.hidden = false;
  }

  function hideError() {
    if (errorMessage) errorMessage.hidden = true;
  }

  // -------------------------------------------------------------------------
  // Backend API call: POST /api/generate with prompt + domain
  // Optional: add Authorization header if your API requires HF token from frontend (use HF_TOKEN_PLACEHOLDER)
  // -------------------------------------------------------------------------
  function callGenerateAPI(prompt, domain) {
    var url = API_BASE_URL + '/api/generate';
    var headers = { 'Content-Type': 'application/json' };
    if (HF_TOKEN_PLACEHOLDER) {
      headers['Authorization'] = 'Bearer ' + HF_TOKEN_PLACEHOLDER;
    }
    return fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ prompt: prompt, domain: domain })
    });
  }

  function setLoading(loading) {
    if (!btnGenerate) return;
    btnGenerate.disabled = loading;
    if (loading) btnGenerate.classList.add('is-loading');
    else btnGenerate.classList.remove('is-loading');
  }

  // -------------------------------------------------------------------------
  // Generate flow: fade out old preview → fetch → normalize → render → fade in
  // -------------------------------------------------------------------------
  function runGenerate() {
    var prompt = (promptTextarea && promptTextarea.value) ? promptTextarea.value.trim() : '';
    if (!prompt) {
      showError('Please enter a dataset description.');
      return;
    }
    hideError();
    setLoading(true);

    var hadPreview = previewWrapper && previewWrapper.classList.contains('is-visible');

    function showPreview(schema, rows) {
      renderSchema(schema);
      renderSampleTable(schema, rows);
      if (previewWrapper) {
        previewWrapper.classList.remove('is-hidden');
        previewWrapper.classList.add('is-visible');
      }
      gsap.fromTo(previewWrapper, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
      gsap.fromTo(schemaCard, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, delay: 0.08, ease: 'power2.out' });
      gsap.fromTo(sampleCard, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, delay: 0.16, ease: 'power2.out' });
      previewWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function onDone() {
      setLoading(false);
    }

    if (hadPreview) {
      gsap.to(previewWrapper, { opacity: 0, duration: 0.25, ease: 'power2.in' }).then(function () {
        callGenerateAPI(prompt, selectedDomain)
          .then(function (res) {
            if (!res.ok) throw new Error(res.statusText || 'Request failed');
            return res.json();
          })
          .then(function (data) {
            // FORCE SHOW RAW OUTPUT (DEBUG MODE)
            previewWrapper.classList.remove('is-hidden');
            previewWrapper.classList.add('is-visible');

            schemaList.innerHTML = `
              <pre style="white-space: pre-wrap; font-size: 12px; line-height: 1.4;">
          ${JSON.stringify(data, null, 2)}
              </pre>
            `;

            sampleThead.innerHTML = '';
            sampleTbody.innerHTML = '';
          })

          .catch(function (err) {
            showError(err.message || 'Network or server error. Is the backend running at ' + API_BASE_URL + '?');
          })
          .then(onDone);
      });
    } else {
      callGenerateAPI(prompt, selectedDomain)
        .then(function (res) {
          if (!res.ok) throw new Error(res.statusText || 'Request failed');
          return res.json();
        })
        .then(function (data) {
          var normalized = normalizeResponse(data);
          if (!normalized.schema.length) {
            showError('No schema or sample data in response.');
            return;
          }
          showPreview(normalized.schema, normalized.rows);
        })
        .catch(function (err) {
          showError(err.message || 'Network or server error. Is the backend running at ' + API_BASE_URL + '?');
        })
        .then(onDone);
    }
  }

  function bindGenerateButton() {
    if (!btnGenerate) return;
    btnGenerate.addEventListener('click', runGenerate);
  }

  // -------------------------------------------------------------------------
  // Init
  // -------------------------------------------------------------------------
  function init() {
    initHeroAnimation();
    initFloatingOrbs();
    initParallaxOrbs();
    initPromptCardIdle();
    initScrollReveals();
    initDomainSelector();
    bindGenerateButton();
    hideError();
    if (previewWrapper) previewWrapper.classList.add('is-hidden');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();