# config valid only for current version of Capistrano
lock '3.7.2'

set :application, 'BookerBot'
set :repo_url, 'git@github.com:ozfortress/BookerBot.git'
set :service_name, 'booker-bot.service'

# Default branch is :master
# ask :branch, `git rev-parse --abbrev-ref HEAD`.chomp

# Default deploy_to directory is /var/www/my_app_name
set :deploy_to, '/opt/booker-bot'

# Default value for :format is :airbrussh.
# set :format, :airbrussh

# You can configure the Airbrussh format using :format_options.
# These are the defaults.
# set :format_options, command_output: true, log_file: 'log/capistrano.log', color: :auto, truncate: :auto

# Default value for :pty is false
# set :pty, true

# Default value for :linked_files is []
append :linked_files, 'config/secrets.json'
# append :linked_files, 'config/database.yml', 'config/secrets.yml'

# Default value for linked_dirs is []
append :linked_dirs, 'node_modules'
# append :linked_dirs, 'log', 'tmp/pids', 'tmp/cache', 'tmp/sockets', 'public/system'

# Default value for default_env is {}
# set :default_env, { path: '/opt/ruby/bin:$PATH' }

# Default value for keep_releases is 5
set :keep_releases, 5

namespace :deploy do
  desc 'Fetch Dependencies'
  task :npm_install do
    on roles(:app) do
      within current_path do
        execute :npm, :install
      end
    end
  end

  desc 'Restart Application'
  task :restart do
    on roles(:app) do
      execute :sudo, :systemctl, :restart, fetch(:service_name)
    end
  end

  after :publishing, :npm_install
  after :npm_install, :restart
end
