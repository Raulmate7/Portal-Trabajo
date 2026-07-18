import React from 'react';
import Image from 'next/image';

interface ResourceCardProps {
  title: string;
  description: string;
  link: string;
  imageSrc: string;
}

export default function ResourceCard({ title, description, link, imageSrc }: ResourceCardProps) {
  return (
    <a href={link} className="resource-card" target="_blank" rel="noopener noreferrer">
      <div className="card-image">
        <Image src={imageSrc} alt={title} width={200} height={120} />
      </div>
      <div className="card-content">
        <h3 className="card-title">{title}</h3>
        <p className="card-description">{description}</p>
      </div>
    </a>
  );
}

/*
  Styles (CSS) are defined in styles/resources.css.
  The component uses micro‑animations: fade‑in on load and scale‑up on hover.
*/
