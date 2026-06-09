import React from 'react'

const AmbientBackground: React.FC = () => (
  <div className="ambient-bg" aria-hidden>
    <div className="ambient-bg__mesh" />
    <div className="ambient-bg__grid" />
    <div className="ambient-bg__orb ambient-bg__orb--1" />
    <div className="ambient-bg__orb ambient-bg__orb--2" />
    <div className="ambient-bg__orb ambient-bg__orb--3" />
  </div>
)

export default AmbientBackground
