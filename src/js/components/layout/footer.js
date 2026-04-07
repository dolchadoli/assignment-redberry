class Footer {
  render() {
    return `
      <footer class="footer">
        <div class="footer-container">
          <div class="footer-top">
            <div class="footer-brand">
              <a href="#/" class="footer-brand-head" aria-label="Go to dashboard">
                <img src="/assets/images/Logo.png" alt="Bootcamp" class="footer-logo" />
                <span class="footer-brand-title">Bootcamp</span>
              </a>
              <p class="footer-brand-text">Your learning journey starts here!<br />Browse courses to get started.</p>
              <div class="footer-socials" aria-label="Social links">
                <a href="#" class="footer-social-link" aria-label="Facebook">
                  <img src="/assets/icons/Facebook.svg" alt="" class="footer-social-icon" />
                </a>
                <a href="#" class="footer-social-link" aria-label="Twitter"><img src="/assets/icons/Twitter.svg" alt="" class="footer-social-icon" /></a>
                <a href="#" class="footer-social-link" aria-label="Instagram"><img src="/assets/icons/Instagram.svg" alt="" class="footer-social-icon" /></a>
                <a href="#" class="footer-social-link" aria-label="LinkedIn"><img src="/assets/icons/LinkedIn.svg" alt="" class="footer-social-icon" /></a>
                <a href="#" class="footer-social-link" aria-label="YouTube"><img src="/assets/icons/YouTube.svg" alt="" class="footer-social-icon" /></a>
              </div>
            </div>

            <div class="footer-columns">
              <div class="footer-col">
                <h4 class="footer-col-title">Explore</h4>
                <a href="#/" class="footer-col-link">Enrolled Courses</a>
                <a href="#/courses" class="footer-col-link">Browse Courses</a>
              </div>

              <div class="footer-col">
                <h4 class="footer-col-title">Account</h4>
                <a href="#" class="footer-col-link">My Profile</a>
              </div>

              <div class="footer-col footer-col-contact">
                <h4 class="footer-col-title">Contact</h4>
                <p class="footer-contact-line"><img src="/assets/icons/mail.svg" alt="" class="footer-contact-icon" /> contact@company.com</p>
                <p class="footer-contact-line"><img src="/assets/icons/phone.svg" alt="" class="footer-contact-icon" /> (+995) 555 111 222</p>
                <p class="footer-contact-line"><img src="/assets/icons/location.svg" alt="" class="footer-contact-icon" /> Aghmashenebeli St.115</p>
              </div>
            </div>
          </div>

          <div class="footer-bottom">
            <p class="footer-copy">Copyright © 2026 Redberry International</p>
            <p class="footer-legal">All Rights Reserved | <a href="#" class="footer-legal-link">Terms and Conditions</a> | <a href="#" class="footer-legal-link">Privacy Policy</a></p>
          </div>
        </div>
      </footer>
    `;
  }
}

const footer = new Footer();
export default footer;





