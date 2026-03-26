import Team from '@/components/shadcn-studio/blocks/team-section-01/team-section-01'
import { HeaderWrapper } from "@/components/header-wrapper"
import { Footer } from "@/components/footer"

const teamMembers = [
  {
    image: 'https://ahrlqwqbbremngaeftjs.supabase.co/storage/v1/object/public/team-images/LalitSir.jpeg',
    alt: 'Prof. L. R. Patil ',
    name: 'Prof. L. R. Patil ',
    role: 'Founder & CEO',
    description: 'A visionary leader driving innovation, strategic growth, and organizational excellence.',
    socialLinks: {
      linkedin: 'https://www.linkedin.com/in/lalit-patil-35450bb9/'
    }
  },
  {
    image: 'https://ahrlqwqbbremngaeftjs.supabase.co/storage/v1/object/public/team-images/IndrajitSir.jpeg',
    alt: 'Prof. Indrajit Sonawane',
    name: 'Prof. Indrajit Sonawane',
    role: 'Co-Founder',
    description: 'Pioneering innovative solutions to empower the next generation of digital leaders.',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/indrajit-sonawane-patil-4aa80519/'
    }
  },
  {
    image: 'https://ahrlqwqbbremngaeftjs.supabase.co/storage/v1/object/public/team-images/Shabbir2.jpeg',
    alt: 'Shabbir Ezzy',
    name: 'Shabbir Ezzy',
    role: 'Manager & Lead Developer',
    description: 'Expert in full-stack development and technical management, building scalable digital solutions.',
    socialLinks: {
      github: 'https://github.com/ezzyshabbir05',
      instagram: 'https://instagram.com/ezzyshabbir05',
      linkedin: 'https://linkedin.com/in/ezzyshabbir05'
    }
  },
  {
    image: 'https://ahrlqwqbbremngaeftjs.supabase.co/storage/v1/object/public/team-images/Pushkar2.jpeg',
    alt: 'Pushkar Gaikwad',
    name: 'Pushkar Gaikwad',
    role: 'Database Manager',
    description: 'Expert in database architecture and data management, ensuring system reliability and performance.',
    socialLinks: {
      github: 'https://github.com/pushkar2510',
      instagram: 'https://instagram.com/pushkar25.10',
      linkedin: 'https://linkedin.com/in/pushkar2510'
    }
  },

  {
    image: 'https://ahrlqwqbbremngaeftjs.supabase.co/storage/v1/object/public/team-images/Pranav.jpeg',
    alt: 'Pranav Choudhary',
    name: 'Pranav Choudhary',
    role: 'Marketing Lead',
    description: 'Strategist dedicated to brand growth and creating impactful marketing campaigns.',
    socialLinks: {
      github: 'https://github.com/PRANAVC16',
      instagram: 'https://instagram.com/_pranavxvi_',
      linkedin: 'https://linkedin.com/in/pranav-choudhary-153084240/'
    }
  },
  {
    image: 'https://ahrlqwqbbremngaeftjs.supabase.co/storage/v1/object/public/team-images/Abhishek.jpeg',
    alt: 'Abhishek Patil',
    name: 'Abhishek Patil',
    role: 'UI/UX Lead',
    description: 'Passionate about creating user-centric designs and intuitive digital experiences.',
    socialLinks: {
      github: 'https://github.com/webdevabhi-1612',
      instagram: 'https://instagram.com/abhishekfins',
      linkedin: 'https://linkedin.com/in/abhii1612'
    }
  },
  {
    image: 'https://ahrlqwqbbremngaeftjs.supabase.co/storage/v1/object/public/team-images/Vaishnavi.jpeg',
    alt: 'Vaishnavi Dharam',
    name: 'Vaishnavi Dharam',
    role: 'Customer Success',
    description: 'Committed to providing exceptional support and ensuring client success and satisfaction.',
    socialLinks: {
      github: 'https://github.com/vaish5115',
      instagram: 'https://instagram.com/manivaishnu',
      linkedin: 'https://linkedin.com/in/vaishnavidharam511/'
    }
  },

  {
    image: 'https://ahrlqwqbbremngaeftjs.supabase.co/storage/v1/object/public/team-images/Huzefa.jpeg',
    alt: 'Huzefa Sabir',
    name: 'Huzefa Sabir',
    role: 'Software Team',
    description: 'Dedicated software developer focused on building high-quality, efficient code solutions.',
    socialLinks: {
      github: 'https://github.com/HuzefaSabir',
      instagram: 'https://instagram.com/huzefasabir_',
      linkedin: 'https://linkedin.com/in/huzefasabir/'
    }
  },
  {
    image: 'https://ahrlqwqbbremngaeftjs.supabase.co/storage/v1/object/public/team-images/Shital.jpeg',
    alt: 'Shital Jaykar',
    name: 'Shital Jaykar',
    role: 'Marketing Team',
    description: 'Creative marketing professional focused on audience engagement and brand awareness.',
    socialLinks: {
      instagram: 'https://instagram.com/mainly.shital',
      linkedin: 'https://linkedin.com/in/shital-jaykar-067294386/'
    }
  },
  {
    image: 'https://ahrlqwqbbremngaeftjs.supabase.co/storage/v1/object/public/team-images/Sidra.jpeg',
    alt: 'Sidra Chaudhari',
    name: 'Sidra Chaudhari',
    role: 'Software Team',
    description: 'Enthusiastic developer building modern web applications with a focus on performance.',
    socialLinks: {
      github: 'https://github.com/sidrachaudhari',
      instagram: 'https://instagram.com/_.sidrahere._',
      linkedin: 'https://linkedin.com/in/sidra-chaudhari/'
    }
  },
  {
    image: 'https://ahrlqwqbbremngaeftjs.supabase.co/storage/v1/object/public/team-images/Vishal2.jpeg',
    alt: 'Vishal Raut',
    name: 'Vishal Raut',
    role: 'Software Team',
    description: 'Skilled in MERN stack development, dedicated to building high-performance and interactive web solutions.',
    socialLinks: {
      github: 'https://github.com/VishalRaut2106',
      instagram: 'https://instagram.com/vishalraut.05',
      linkedin: 'https://linkedin.com/in/vishalraut2106/'
    }
  },


]

const TeamPage = () => {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden supports-[overflow:clip]:overflow-clip">
      <HeaderWrapper />
      <main className="flex-1">
        <Team teamMembers={teamMembers} />
      </main>
      {/* <Footer /> */}
    </div>
  )
}

export default TeamPage
