import { Facebook, Github, Instagram, Twitter, Linkedin } from 'lucide-react'

import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

type TeamMember = {
  image: string
  alt: string
  name: string
  role: string
  description: string
  socialLinks: {
    facebook?: string
    twitter?: string
    github?: string
    instagram?: string
    linkedin?: string
  }
}[]

const Team = ({ teamMembers }: { teamMembers: TeamMember }) => {
  return (
    <section className='py-8 sm:py-16 lg:py-24'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='mb-12 text-center sm:mb-16 lg:mb-24'>
          <h2 className='mb-4 text-2xl font-semibold md:text-3xl lg:text-4xl'>Get to Know Our Amazing Team</h2>
          <p className='text-muted-foreground text-xl'>
            Meet the Passionate Experts Behind Our Success and Learn More About Their Roles.
          </p>
        </div>

        {/* Team Members */}
        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-y-10 xl:grid-cols-4'>
          {teamMembers.map((member, index) => (
            <Card
              key={index}
              className='hover:border-primary overflow-hidden py-0 shadow-none transition-colors duration-300'
            >
              <CardContent className='px-0'>
                <div className='bg-muted'>
                  <img src={member.image} alt={member.alt} className='h-75 w-full object-cover' />
                </div>
                <div className='space-y-3 p-4'>
                  <CardTitle className='text-lg'>{member.name}</CardTitle>
                  {/* <Separator /> */}
                  <div className='text-muted-foreground'>
                    <Badge variant='outline' className='mb-2 uppercase tracking-wide'>
                      {member.role}
                    </Badge>
                    <p className='text-sm'>{member.description}</p>
                  </div>
                  <div className='flex gap-3'>
                    {member.socialLinks.linkedin && (
                      <a href={member.socialLinks.linkedin}>
                        <Linkedin className='size-5' />
                      </a>
                    )}
                    {member.socialLinks.facebook && (
                      <a href={member.socialLinks.facebook}>
                        <Facebook className='size-5' />
                      </a>
                    )}
                    {member.socialLinks.twitter && (
                      <a href={member.socialLinks.twitter}>
                        <Twitter className='size-5' />
                      </a>
                    )}
                    {member.socialLinks.github && (
                      <a href={member.socialLinks.github}>
                        <Github className='size-5' />
                      </a>
                    )}
                    {member.socialLinks.instagram && (
                      <a href={member.socialLinks.instagram}>
                        <Instagram className='size-5' />
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Team
