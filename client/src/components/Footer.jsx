import {FaFacebook,FaInstagram,FaYoutube,FaTwitter,FaGithub} from 'react-icons/fa'

function Footer() {
  const styles = {
    footer: {
      backgroundColor: '#172519',
      color: '#edf6f9',
      width: '100vw',
      padding: '32px 20px',
      borderTop: '1px solid rgba(255,255,255,0.08)'
    },
    message: {
      maxWidth: '900px',
      margin: '0 auto 24px auto',
      textAlign: 'center'
    },
    messageTitle: {
      fontSize: '20px',
      fontWeight: 600,
      marginBottom: '6px'
    },
    messageText: {
      fontSize: '14px',
      opacity: 0.9,
      marginBottom: '12px'
    },
    form: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      flexWrap: 'wrap'
    },
    input: {
      height: '40px',
      width: '280px',
      borderRadius: '8px',
      border: '1px solid #2c3a2f',
      background: '#0f1a13',
      color: '#e6f3ea',
      padding: '0 12px'
    },
    button: {
      height: '40px',
      padding: '0 14px',
      borderRadius: '8px',
      border: '1px solid #2e7d32',
      background: '#2e7d32',
      color: 'white',
      cursor: 'pointer'
    },
    hr: {
      maxWidth: '1100px',
      margin: '20px auto',
      border: 0,
      borderTop: '1px solid rgba(255,255,255,0.08)'
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      flexWrap: 'wrap'
    },
    brand: {
      fontSize: '14px',
      opacity: 0.9
    },
    links: {
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      listStyle: 'none',
      padding: 0,
      margin: 0
    },
    link: {
      color: '#cfe9d6',
      textDecoration: 'none',
      fontSize: '14px'
    },
    icons: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    iconAnchor: {
      color: '#edf6f9'
    }
  };

  return (
    <footer style={styles.footer}>
      {/* Message / email section */}
      <div style={styles.message}>
        <div style={styles.messageTitle}>Stay in the loop</div>
        <div style={styles.messageText}>Get updates, eco tips and offers. Enter your email to subscribe.</div>
        <form style={styles.form} onSubmit={(e)=>e.preventDefault()}>
          <input type="email" required placeholder="Enter your email" style={styles.input} />
          <button type="submit" style={styles.button}>Subscribe</button>
        </form>
      </div>

      <hr style={styles.hr} />

      <div style={styles.container}>
        <div style={styles.brand}>
          &copy; {new Date().getFullYear()} EcoFare — Drive green. Ride smart.
        </div>

        <ul style={styles.links}>
          <li><a style={styles.link} href="/about">About</a></li>
          <li><a style={styles.link} href="/terms">Terms</a></li>
          <li><a style={styles.link} href="/privacy">Privacy</a></li>
          <li><a style={styles.link} href="/contact">Contact</a></li>
        </ul>

        <div style={styles.icons}>
          <a style={styles.iconAnchor} aria-label="Facebook" href="https://facebook.com" target="_blank" rel="noreferrer"><FaFacebook size={20} /></a>
          <a style={styles.iconAnchor} aria-label="Instagram" href="https://instagram.com" target="_blank" rel="noreferrer"><FaInstagram size={20} /></a>
          <a style={styles.iconAnchor} aria-label="YouTube" href="https://youtube.com" target="_blank" rel="noreferrer"><FaYoutube size={20} /></a>
          <a style={styles.iconAnchor} aria-label="Twitter" href="https://twitter.com" target="_blank" rel="noreferrer"><FaTwitter size={20} /></a>
          <a style={styles.iconAnchor} aria-label="GitHub" href="https://github.com" target="_blank" rel="noreferrer"><FaGithub size={20} /></a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
