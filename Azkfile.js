/**
 * Documentation: http://docs.azk.io/Azkfile.js
 */
// Adds the systems that shape your system
systems({
    server: {
        // Dependent systems
        depends: [],
        // More images:  http://images.azk.io
        image: {"docker": "azukiapp/node"},
        // Steps to execute before running instances
        provision: [
            "npm install",
        ],
        workdir: "/azk/#{manifest.dir}",
        shell: "/bin/bash",
        command: ["npm", "start"],
        wait: 20,
        mounts: {
            '/azk/#{manifest.dir}': sync("."),
            '/azk/#{manifest.dir}/node_modules': persistent("./node_modules"),
        },
        scalable: {"default": 1},
        http: {
            domains: ["#{system.name}.#{azk.default_domain}"]
        },
        ports: {
            // exports global variables
            http: "1337/tcp",
        },
        envs: {
            // Make sure that the PORT value is the same as the one
            // in ports/http below, and that it's also the same
            // if you're setting it in a .env file
            NODE_ENV: "dev",
            PORT: "3000",
            DOMAIN: "#{system.name}.#{azk.default_domain}",
            SERVER_URL: "#{system.name}.#{azk.default_domain}/parse",
            // DEFINES
            APP_NAME: 'Photogram',
            APP_ID: 'myAppId',
            MASTER_KEY: 'myMasterKey',
            MASTER_REST_KEY: 'MPhotogramMasterKey',

            // DASHBOARD
            DASHBOARD_USER: 'admin',
            DASHBOARD_PASSWORD: 'admin123',

            // S3
            // AWS_ACCESS_KEY_ID: '',
            // AWS_SECRET_ACCESS_KEY: '',
            // BUCKET_NAME: '',
            //MAILGUN EMAIL
            // MAILGUN_API_KEY: 'key-3a05e956706a4bd579982460b96cf43a',
            // MAILGUN_DOMAIN: '',
            // MAILGUN_FROM_ADDRESS: '',
        },
    },

    ngrok: {
        // Dependent systems
        depends: ["server"],
        // image     : {"docker" : "gullitmiranda/docker-ngrok"},
        image: {"docker": "azukiapp/ngrok:latest"},
        // Mounts folders to assigned paths
        mounts: {
            // equivalent persistent_folders
            '/ngrok/log': path("./log"),
        },
        scalable: {"default": 1},
        // do not expect application response
        wait: false,
        http: {
            domains: ["#{manifest.dir}-#{system.name}.#{azk.default_domain}"],
        },
        ports: {
            http: "4040"
        },
        envs: {
            // NGROK_SUBDOMAIN : "parse-server",
            NGROK_AUTH: "6FVyB2mzY3AtDYQo8HrNp_3HLabkpw6nBb9P7aQrnCd",
            NGROK_LOG: "/ngrok/log/ngrok.log",
            NGROK_CONFIG: "/ngrok/ngrok.yml",
        }
    }
    // mongodb: {
    //     image: {docker: 'azukiapp/mongodb'},
    //     scalable: false,
    //     wait: 20,
    //     // Mounts folders to assigned paths
    //     mounts: {
    //         // to keep data between the executions
    //         '/data/db': persistent('mongodb-#{manifest.dir}'),
    //     },
    //     ports: {
    //         http: '28017/tcp',
    //         data: '27017/tcp',
    //     },
    //     http: {
    //         // mongodb.azk.dev
    //         domains: ['#{manifest.dir}-#{system.name}.#{azk.default_domain}'],
    //     },
    //     export_envs: {
    //         DATABASE_URI: 'mongodb://#{net.host}:#{net.port.data}/#{manifest.dir}_development',
    //     },
    // },
});
