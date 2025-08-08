import React from 'react';

const SkipLinks: React.FC = () => {
  return (
    <>
      <a
        href="#main-content"
        className="skip-link"
        aria-label="Passer au contenu principal"
      >
        Passer au contenu principal
      </a>
      <a
        href="#navigation"
        className="skip-link"
        aria-label="Passer à la navigation"
      >
        Passer à la navigation
      </a>
      <a
        href="#footer"
        className="skip-link"
        aria-label="Passer au pied de page"
      >
        Passer au pied de page
      </a>
    </>
  );
};

export default SkipLinks;
